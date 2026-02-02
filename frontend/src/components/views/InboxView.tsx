import { useState, useMemo } from 'react';
import {
  Inbox,
  Plus,
  ArrowRight,
  Trash2,
  Sun,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button, Input, Modal, Select } from '../ui';
import type { Task } from '../../types';
import { formatDate } from '../../lib/utils';

interface InboxViewProps {
  onTaskClick: (taskId: string) => void;
}

export function InboxView({ onTaskClick }: InboxViewProps) {
  const { tasks, projects, addTask, deleteTask, moveTask, addToToday } = useStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [triageTask, setTriageTask] = useState<Task | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');

  // Get inbox tasks (no project assigned)
  const inboxTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.projectId && !t.archived)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tasks]
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      projectId: null,
      columnId: null,
      contextTags: [],
      inToday: false,
      archived: false,
    });
    setNewTaskTitle('');
  };

  const handleTriage = (task: Task) => {
    setTriageTask(task);
    setTargetProjectId(projects[0]?.id || '');
  };

  const handleConfirmTriage = () => {
    if (!triageTask || !targetProjectId) return;

    const project = projects.find((p) => p.id === targetProjectId);
    const firstColumn = project?.columns[0];

    moveTask(triageTask.id, targetProjectId, firstColumn?.id || null);
    setTriageTask(null);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleAddToToday = (taskId: string) => {
    addToToday(taskId);
  };

  const activeProjects = projects.filter((p) => !p.archived);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Inbox className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Inbox</h1>
            <p className="text-sm text-gray-500">
              {inboxTasks.length} items to process
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <form onSubmit={handleAddTask} className="flex gap-3">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Capture a thought..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newTaskTitle.trim()}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </form>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-2">
          {inboxTasks.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Inbox zero!</p>
              <p className="text-sm text-gray-600">
                All caught up. Capture new thoughts above.
              </p>
            </div>
          ) : (
            inboxTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 p-4 bg-[#1a1a1a] border border-[#333333] rounded-lg hover:border-[#444444] transition-colors"
              >
                {/* Task Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onTaskClick(task.id)}
                >
                  <h4 className="text-sm font-medium text-white truncate">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {task.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Added {formatDate(task.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAddToToday(task.id)}
                    className="p-2 text-gray-500 hover:text-amber-500 hover:bg-[#262626] rounded-lg transition-colors"
                    title="Add to today"
                  >
                    <Sun className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTriage(task)}
                    className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-[#262626] rounded-lg transition-colors"
                    title="Move to project"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#262626] rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Triage Modal */}
      {triageTask && (
        <Modal
          isOpen={true}
          onClose={() => setTriageTask(null)}
          title="Move to Project"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Task:</p>
              <p className="text-white font-medium">{triageTask.title}</p>
            </div>

            <Select
              label="Select Project"
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              options={activeProjects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />

            {activeProjects.length === 0 && (
              <p className="text-sm text-amber-500">
                No projects available. Create a project first.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setTriageTask(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmTriage}
                disabled={!targetProjectId}
              >
                <ArrowRight className="w-4 h-4" />
                Move
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
