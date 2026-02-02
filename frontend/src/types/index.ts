export type EnergyLevel = 'low' | 'medium' | 'high';

export interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  countsAsDone: boolean;
  wipLimit?: number;
}

export interface Project {
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string | null; // null = inbox
  columnId: string | null;
  dueDate?: string;
  scheduledDate?: string;
  energyLevel?: EnergyLevel;
  contextTags: string[];
  timeEstimate?: number; // minutes
  position: number;
  inToday: boolean;
  archived: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId?: string;
  startTime: string;
  endTime?: string;
  duration?: number; // milliseconds
  notes?: string;
  createdAt: string;
}

export interface ActiveTimer {
  taskId?: string;
  projectId?: string;
  startTime: string;
}

export interface Settings {
  todayTaskLimit: number;
  autoIncludeDueToday: boolean;
  theme: 'dark' | 'light' | 'system';
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
}

export type ViewType = 'today' | 'inbox' | 'board' | 'list';

export interface AppState {
  // Data
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer | null;
  settings: Settings;

  // UI State
  currentView: ViewType;
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  isQuickAddOpen: boolean;
  isCommandPaletteOpen: boolean;

  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addColumn: (projectId: string, column: Omit<Column, 'id' | 'position'>) => void;
  updateColumn: (projectId: string, columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (projectId: string, columnId: string) => void;
  reorderColumns: (projectId: string, columnIds: string[]) => void;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'position' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, projectId: string | null, columnId: string | null) => void;
  reorderTasks: (taskIds: string[], columnId: string | null) => void;
  addToToday: (taskId: string) => void;
  removeFromToday: (taskId: string) => void;
  completeTask: (taskId: string) => void;

  // Timer Actions
  startTimer: (taskId?: string, projectId?: string) => void;
  stopTimer: () => TimeEntry | null;

  // Time Entry Actions
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;

  // Settings Actions
  updateSettings: (settings: Partial<Settings>) => void;

  // UI Actions
  setCurrentView: (view: ViewType) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSelectedTask: (taskId: string | null) => void;
  setQuickAddOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
}

export const DEFAULT_COLUMNS: Omit<Column, 'id'>[] = [
  { name: 'Backlog', color: '#6b7280', position: 0, countsAsDone: false },
  { name: 'To Do', color: '#3b82f6', position: 1, countsAsDone: false },
  { name: 'In Progress', color: '#f59e0b', position: 2, countsAsDone: false },
  { name: 'Done', color: '#22c55e', position: 3, countsAsDone: true },
];

export const DEFAULT_SETTINGS: Settings = {
  todayTaskLimit: 7,
  autoIncludeDueToday: true,
  theme: 'dark',
  startOfWeek: 1,
};

export const ENERGY_COLORS: Record<EnergyLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: 'Low Energy',
  medium: 'Medium Energy',
  high: 'High Energy',
};
