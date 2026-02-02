import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { AppState, Project, Task, Column, TimeEntry } from '../types';
import * as db from '../lib/db';

const defaultColumns: Omit<Column, 'id'>[] = [
  { name: 'Backlog', color: '#6b7280', position: 0, countsAsDone: false },
  { name: 'To Do', color: '#3b82f6', position: 1, countsAsDone: false },
  { name: 'In Progress', color: '#f59e0b', position: 2, countsAsDone: false },
  { name: 'Done', color: '#22c55e', position: 3, countsAsDone: true },
];

const defaultSettings = {
  todayTaskLimit: 7,
  autoIncludeDueToday: true,
  theme: 'dark' as const,
  startOfWeek: 1 as const,
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimer: null,
  settings: defaultSettings,
  currentView: 'today',
  selectedProjectId: null,
  selectedTaskId: null,
  isQuickAddOpen: false,
  isCommandPaletteOpen: false,

  // Load from storage
  loadFromStorage: async () => {
    const [projects, tasks, timeEntries, settings] = await Promise.all([
      db.getAllProjects(),
      db.getAllTasks(),
      db.getAllTimeEntries(),
      db.getSettings(),
    ]);
    set({
      projects,
      tasks,
      timeEntries,
      settings: settings || defaultSettings,
    });
  },

  // Project Actions
  addProject: (projectData) => {
    const now = new Date().toISOString();
    const project: Project = {
      ...projectData,
      id: uuid(),
      columns: defaultColumns.map((col) => ({ ...col, id: uuid() })),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ projects: [...state.projects, project] }));
    db.saveProject(project);
    return project;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
    const project = get().projects.find((p) => p.id === id);
    if (project) db.saveProject(project);
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
    }));
    db.deleteProject(id);
  },

  addColumn: (projectId, columnData) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const newColumn: Column = {
          ...columnData,
          id: uuid(),
          position: p.columns.length,
        };
        return {
          ...p,
          columns: [...p.columns, newColumn],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) db.saveProject(project);
  },

  updateColumn: (projectId, columnId, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) db.saveProject(project);
  },

  deleteColumn: (projectId, columnId) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.filter((c) => c.id !== columnId),
          updatedAt: new Date().toISOString(),
        };
      }),
      tasks: state.tasks.map((t) =>
        t.projectId === projectId && t.columnId === columnId
          ? { ...t, columnId: null }
          : t
      ),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) db.saveProject(project);
  },

  reorderColumns: (projectId, columnIds) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const reordered = columnIds.map((id, index) => {
          const col = p.columns.find((c) => c.id === id);
          return col ? { ...col, position: index } : null;
        }).filter(Boolean) as Column[];
        return {
          ...p,
          columns: reordered,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    const project = get().projects.find((p) => p.id === projectId);
    if (project) db.saveProject(project);
  },

  // Task Actions
  addTask: (taskData) => {
    const now = new Date().toISOString();
    const tasks = get().tasks.filter(
      (t) => t.projectId === taskData.projectId && t.columnId === taskData.columnId
    );
    const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) : -1;

    const task: Task = {
      ...taskData,
      id: uuid(),
      position: maxPosition + 1,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ tasks: [...state.tasks, task] }));
    db.saveTask(task);
    return task;
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    const task = get().tasks.find((t) => t.id === id);
    if (task) db.saveTask(task);
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    db.deleteTask(id);
  },

  moveTask: (taskId, projectId, columnId) => {
    const tasks = get().tasks.filter((t) => t.projectId === projectId && t.columnId === columnId);
    const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) : -1;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, projectId, columnId, position: maxPosition + 1, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) db.saveTask(task);
  },

  reorderTasks: (taskIds, columnId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        const index = taskIds.indexOf(t.id);
        if (index === -1) return t;
        return { ...t, position: index, columnId, updatedAt: new Date().toISOString() };
      }),
    }));
    // Save all affected tasks
    const tasks = get().tasks.filter((t) => taskIds.includes(t.id));
    tasks.forEach((task) => db.saveTask(task));
  },

  addToToday: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, inToday: true, updatedAt: new Date().toISOString() } : t
      ),
    }));
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) db.saveTask(task);
  },

  removeFromToday: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, inToday: false, updatedAt: new Date().toISOString() } : t
      ),
    }));
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) db.saveTask(task);
  },

  completeTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.projectId) return;

    const project = get().projects.find((p) => p.id === task.projectId);
    if (!project) return;

    const doneColumn = project.columns.find((c) => c.countsAsDone);
    if (!doneColumn) return;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              columnId: doneColumn.id,
              completedAt: new Date().toISOString(),
              inToday: false,
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    const updatedTask = get().tasks.find((t) => t.id === taskId);
    if (updatedTask) db.saveTask(updatedTask);
  },

  // Timer Actions
  startTimer: (taskId, projectId) => {
    // Stop any existing timer first
    const existingTimer = get().activeTimer;
    if (existingTimer) {
      get().stopTimer();
    }

    set({
      activeTimer: {
        taskId,
        projectId,
        startTime: new Date().toISOString(),
      },
    });
  },

  stopTimer: () => {
    const timer = get().activeTimer;
    if (!timer) return null;

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(timer.startTime).getTime();

    const entry: TimeEntry = {
      id: uuid(),
      taskId: timer.taskId,
      projectId: timer.projectId,
      startTime: timer.startTime,
      endTime,
      duration,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      activeTimer: null,
      timeEntries: [...state.timeEntries, entry],
    }));
    db.saveTimeEntry(entry);

    return entry;
  },

  // Time Entry Actions
  addTimeEntry: (entryData) => {
    const entry: TimeEntry = {
      ...entryData,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ timeEntries: [...state.timeEntries, entry] }));
    db.saveTimeEntry(entry);
  },

  // Settings Actions
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
    db.saveSettings(get().settings);
  },

  // UI Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
  setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
  setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
}));
