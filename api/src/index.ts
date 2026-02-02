import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { db, parseJsonColumn, stringifyJsonColumn } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Types
interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  columns: Column[];
  defaultView: 'board' | 'list';
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  countsAsDone: boolean;
  wipLimit?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string | null;
  columnId: string | null;
  dueDate?: string;
  scheduledDate?: string;
  energyLevel?: 'low' | 'medium' | 'high';
  contextTags: string[];
  timeEstimate?: number;
  position: number;
  inToday: boolean;
  archived: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimeEntry {
  id: string;
  taskId?: string;
  projectId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  createdAt: string;
}

// Active timer state (in-memory)
let activeTimer: { taskId?: string; projectId?: string; startTime: string } | null = null;

// Helper to convert DB row to Project
function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    color: row.color,
    icon: row.icon || undefined,
    columns: parseJsonColumn<Column[]>(row.columns),
    defaultView: row.default_view,
    archived: Boolean(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to convert DB row to Task
function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    projectId: row.project_id,
    columnId: row.column_id,
    dueDate: row.due_date || undefined,
    scheduledDate: row.scheduled_date || undefined,
    energyLevel: row.energy_level || undefined,
    contextTags: parseJsonColumn<string[]>(row.context_tags),
    timeEstimate: row.time_estimate || undefined,
    position: row.position,
    inToday: Boolean(row.in_today),
    archived: Boolean(row.archived),
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to convert DB row to TimeEntry
function rowToTimeEntry(row: any): TimeEntry {
  return {
    id: row.id,
    taskId: row.task_id || undefined,
    projectId: row.project_id || undefined,
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

// ============ PROJECTS ============

// GET /api/projects - List all projects
app.get('/api/projects', (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const stmt = includeArchived
    ? db.prepare('SELECT * FROM projects ORDER BY created_at DESC')
    : db.prepare('SELECT * FROM projects WHERE archived = 0 ORDER BY created_at DESC');
  const rows = stmt.all();
  res.json(rows.map(rowToProject));
});

// POST /api/projects - Create project
app.post('/api/projects', (req, res) => {
  const { name, description, color = '#6366f1', columns = [] } = req.body;
  const now = new Date().toISOString();
  const id = uuid();

  const defaultColumns: Column[] = columns.length > 0 ? columns : [
    { id: uuid(), name: 'Backlog', color: '#6b7280', position: 0, countsAsDone: false },
    { id: uuid(), name: 'To Do', color: '#3b82f6', position: 1, countsAsDone: false },
    { id: uuid(), name: 'In Progress', color: '#f59e0b', position: 2, countsAsDone: false },
    { id: uuid(), name: 'Done', color: '#22c55e', position: 3, countsAsDone: true },
  ];

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, color, columns, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, description || null, color, stringifyJsonColumn(defaultColumns), now, now);

  const project = rowToProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  res.status(201).json(project);
});

// GET /api/projects/:id - Get project by ID
app.get('/api/projects/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(rowToProject(row));
});

// PATCH /api/projects/:id - Update project
app.patch('/api/projects/:id', (req, res) => {
  const { name, description, color, columns, archived } = req.body;
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description || null);
  }
  if (color !== undefined) {
    updates.push('color = ?');
    values.push(color);
  }
  if (columns !== undefined) {
    updates.push('columns = ?');
    values.push(stringifyJsonColumn(columns));
  }
  if (archived !== undefined) {
    updates.push('archived = ?');
    values.push(archived ? 1 : 0);
  }

  values.push(req.params.id);
  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const project = rowToProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
  res.json(project);
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(204).send();
});

// GET /api/projects/:id/tasks - Get tasks for project
app.get('/api/projects/:id/tasks', (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const stmt = includeArchived
    ? db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY position')
    : db.prepare('SELECT * FROM tasks WHERE project_id = ? AND archived = 0 ORDER BY position');
  const rows = stmt.all(req.params.id);
  res.json(rows.map(rowToTask));
});

// ============ TASKS ============

// GET /api/tasks - List all tasks
app.get('/api/tasks', (req, res) => {
  const { projectId, inToday, includeArchived } = req.query;

  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];

  if (projectId !== undefined) {
    if (projectId === 'null' || projectId === '') {
      sql += ' AND project_id IS NULL';
    } else {
      sql += ' AND project_id = ?';
      params.push(projectId);
    }
  }

  if (inToday === 'true') {
    sql += ' AND in_today = 1';
  }

  if (includeArchived !== 'true') {
    sql += ' AND archived = 0';
  }

  sql += ' ORDER BY position';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(rowToTask));
});

// POST /api/tasks - Create task
app.post('/api/tasks', (req, res) => {
  const {
    title,
    description,
    projectId = null,
    columnId = null,
    dueDate,
    scheduledDate,
    energyLevel,
    contextTags = [],
    timeEstimate,
    inToday = false,
  } = req.body;

  const now = new Date().toISOString();
  const id = uuid();

  // Get next position
  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE project_id IS ? AND column_id IS ?'
  ).get(projectId, columnId) as { max: number };
  const position = maxPos.max + 1;

  const stmt = db.prepare(`
    INSERT INTO tasks (
      id, title, description, project_id, column_id, due_date, scheduled_date,
      energy_level, context_tags, time_estimate, position, in_today, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, title, description || null, projectId, columnId, dueDate || null, scheduledDate || null,
    energyLevel || null, stringifyJsonColumn(contextTags), timeEstimate || null,
    position, inToday ? 1 : 0, now, now
  );

  const task = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  res.status(201).json(task);
});

// GET /api/tasks/:id - Get task by ID
app.get('/api/tasks/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(rowToTask(row));
});

// PATCH /api/tasks/:id - Update task
app.patch('/api/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const now = new Date().toISOString();
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  const fields = ['title', 'description', 'projectId', 'columnId', 'dueDate', 'scheduledDate',
    'energyLevel', 'contextTags', 'timeEstimate', 'position', 'inToday', 'archived', 'completedAt'];

  const dbFieldMap: Record<string, string> = {
    projectId: 'project_id',
    columnId: 'column_id',
    dueDate: 'due_date',
    scheduledDate: 'scheduled_date',
    energyLevel: 'energy_level',
    contextTags: 'context_tags',
    timeEstimate: 'time_estimate',
    inToday: 'in_today',
    completedAt: 'completed_at',
  };

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      const dbField = dbFieldMap[field] || field;
      updates.push(`${dbField} = ?`);

      let value = req.body[field];
      if (field === 'contextTags') {
        value = stringifyJsonColumn(value);
      } else if (field === 'inToday' || field === 'archived') {
        value = value ? 1 : 0;
      } else if (value === null) {
        value = null;
      }
      values.push(value);
    }
  }

  values.push(req.params.id);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const task = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
  res.json(task);
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).send();
});

// POST /api/tasks/:id/complete - Mark task as complete
app.post('/api/tasks/:id/complete', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET completed_at = ?, in_today = 0, updated_at = ? WHERE id = ?')
    .run(now, now, req.params.id);

  const updated = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
  res.json(updated);
});

// ============ TIMER ============

// POST /api/tasks/:id/timer/start - Start timer for task
app.post('/api/tasks/:id/timer/start', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Stop existing timer if running
  if (activeTimer) {
    const duration = Date.now() - new Date(activeTimer.startTime).getTime();
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO time_entries (id, task_id, project_id, start_time, end_time, duration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, activeTimer.taskId || null, activeTimer.projectId || null,
      activeTimer.startTime, now, duration, now);
  }

  activeTimer = {
    taskId: req.params.id,
    projectId: (task as any).project_id,
    startTime: new Date().toISOString(),
  };

  res.json({ message: 'Timer started', timer: activeTimer });
});

// POST /api/tasks/:id/timer/stop - Stop timer
app.post('/api/tasks/:id/timer/stop', (req, res) => {
  if (!activeTimer) {
    return res.status(400).json({ error: 'No timer running' });
  }

  const now = new Date().toISOString();
  const duration = Date.now() - new Date(activeTimer.startTime).getTime();
  const id = uuid();

  db.prepare(`
    INSERT INTO time_entries (id, task_id, project_id, start_time, end_time, duration, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, activeTimer.taskId || null, activeTimer.projectId || null,
    activeTimer.startTime, now, duration, now);

  const entry = rowToTimeEntry(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id));
  activeTimer = null;

  res.json(entry);
});

// GET /api/timer - Get current timer status
app.get('/api/timer', (req, res) => {
  res.json({ timer: activeTimer });
});

// ============ TIME ENTRIES ============

// GET /api/time-entries - List time entries
app.get('/api/time-entries', (req, res) => {
  const { taskId, projectId, limit = 100 } = req.query;

  let sql = 'SELECT * FROM time_entries WHERE 1=1';
  const params: any[] = [];

  if (taskId) {
    sql += ' AND task_id = ?';
    params.push(taskId);
  }

  if (projectId) {
    sql += ' AND project_id = ?';
    params.push(projectId);
  }

  sql += ' ORDER BY start_time DESC LIMIT ?';
  params.push(Number(limit));

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(rowToTimeEntry));
});

// POST /api/time-entries - Create manual time entry
app.post('/api/time-entries', (req, res) => {
  const { taskId, projectId, startTime, endTime, duration, notes } = req.body;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO time_entries (id, task_id, project_id, start_time, end_time, duration, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, taskId || null, projectId || null, startTime, endTime || null, duration || null, notes || null, now);

  const entry = rowToTimeEntry(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id));
  res.status(201).json(entry);
});

// ============ SETTINGS ============

// GET /api/settings
app.get('/api/settings', (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = ?').get('default') as any;
  res.json({
    todayTaskLimit: row.today_task_limit,
    autoIncludeDueToday: Boolean(row.auto_include_due_today),
    theme: row.theme,
    startOfWeek: row.start_of_week,
  });
});

// PATCH /api/settings
app.patch('/api/settings', (req, res) => {
  const { todayTaskLimit, autoIncludeDueToday, theme, startOfWeek } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (todayTaskLimit !== undefined) {
    updates.push('today_task_limit = ?');
    values.push(todayTaskLimit);
  }
  if (autoIncludeDueToday !== undefined) {
    updates.push('auto_include_due_today = ?');
    values.push(autoIncludeDueToday ? 1 : 0);
  }
  if (theme !== undefined) {
    updates.push('theme = ?');
    values.push(theme);
  }
  if (startOfWeek !== undefined) {
    updates.push('start_of_week = ?');
    values.push(startOfWeek);
  }

  if (updates.length > 0) {
    values.push('default');
    db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const row = db.prepare('SELECT * FROM settings WHERE id = ?').get('default') as any;
  res.json({
    todayTaskLimit: row.today_task_limit,
    autoIncludeDueToday: Boolean(row.auto_include_due_today),
    theme: row.theme,
    startOfWeek: row.start_of_week,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`GTD API server running on http://localhost:${PORT}`);
});
