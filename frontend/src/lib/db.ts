import { openDB } from 'idb';
import type { Project, Task, TimeEntry, Settings } from '../types';

const DB_NAME = 'gtd-database';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-archived', 'archived');
      }

      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-project', 'projectId');
        taskStore.createIndex('by-column', 'columnId');
        taskStore.createIndex('by-archived', 'archived');
      }

      // Time entries store
      if (!db.objectStoreNames.contains('timeEntries')) {
        const timeEntryStore = db.createObjectStore('timeEntries', { keyPath: 'id' });
        timeEntryStore.createIndex('by-task', 'taskId');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
  const db = await getDB();
  return db.getAll('timeEntries');
}

export async function saveTimeEntry(entry: TimeEntry): Promise<void> {
  const db = await getDB();
  await db.put('timeEntries', entry);
}

export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', 'default');
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'default' });
}
