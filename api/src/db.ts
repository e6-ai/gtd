import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'gtd.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT,
    columns TEXT NOT NULL DEFAULT '[]',
    default_view TEXT NOT NULL DEFAULT 'board',
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT,
    column_id TEXT,
    due_date TEXT,
    scheduled_date TEXT,
    energy_level TEXT,
    context_tags TEXT NOT NULL DEFAULT '[]',
    time_estimate INTEGER,
    position INTEGER NOT NULL DEFAULT 0,
    in_today INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    project_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    today_task_limit INTEGER NOT NULL DEFAULT 7,
    auto_include_due_today INTEGER NOT NULL DEFAULT 1,
    theme TEXT NOT NULL DEFAULT 'dark',
    start_of_week INTEGER NOT NULL DEFAULT 1
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);
  CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);

  -- Insert default settings if not exists
  INSERT OR IGNORE INTO settings (id) VALUES ('default');
`);

// Helper functions for JSON columns
export function parseJsonColumn<T>(value: string | null): T {
  if (!value) return [] as unknown as T;
  try {
    return JSON.parse(value);
  } catch {
    return [] as unknown as T;
  }
}

export function stringifyJsonColumn(value: unknown): string {
  return JSON.stringify(value);
}

console.log('Database initialized at:', dbPath);
