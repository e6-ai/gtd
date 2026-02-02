import { useState, useEffect } from 'react';
import { Trash2, Sun } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Modal, Button, Input, TextArea, Select } from '../ui';
import { useStore } from '../../store';
import type { EnergyLevel } from '../../types';

interface TaskEditModalProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskEditModal({ taskId, onClose }: TaskEditModalProps) {
  const { tasks, projects, updateTask, deleteTask, addToToday, removeFromToday } = useStore();
  const task = tasks.find((t) => t.id === taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [columnId, setColumnId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | ''>('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [contextTags, setContextTags] = useState('');
  const [inToday, setInToday] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setProjectId(task.projectId);
      setColumnId(task.columnId);
      setDueDate(task.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : '');
      setScheduledDate(task.scheduledDate ? format(parseISO(task.scheduledDate), 'yyyy-MM-dd') : '');
      setEnergyLevel(task.energyLevel || '');
      setTimeEstimate(task.timeEstimate ? String(task.timeEstimate) : '');
      setContextTags(task.contextTags.join(', '));
      setInToday(task.inToday);
    }
  }, [task]);

  if (!task) return null;

  const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;

  const handleSave = () => {
    updateTask(task.id, {
      title,
      description: description || undefined,
      projectId,
      columnId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      energyLevel: energyLevel || undefined,
      timeEstimate: timeEstimate ? parseInt(timeEstimate) : undefined,
      contextTags: contextTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    if (inToday !== task.inToday) {
      if (inToday) {
        addToToday(task.id);
      } else {
        removeFromToday(task.id);
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    const newProject = newProjectId ? projects.find((p) => p.id === newProjectId) : null;
    setProjectId(newProjectId || null);
    setColumnId(newProject?.columns[0]?.id || null);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Task" size="lg">
      <div className="space-y-4">
        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />

        {/* Description */}
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
        />

        {/* Project & Column */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Project"
            value={projectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            options={[
              { value: '', label: 'Inbox' },
              ...projects
                .filter((p) => !p.archived)
                .map((p) => ({ value: p.id, label: p.name })),
            ]}
          />

          {selectedProject && (
            <Select
              label="Column"
              value={columnId || ''}
              onChange={(e) => setColumnId(e.target.value || null)}
              options={selectedProject.columns.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label="Scheduled Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>

        {/* Energy & Time Estimate */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Energy Level"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(e.target.value as EnergyLevel | '')}
            options={[
              { value: '', label: 'None' },
              { value: 'low', label: '🔋 Low' },
              { value: 'medium', label: '⚡ Medium' },
              { value: 'high', label: '🔥 High' },
            ]}
          />
          <Input
            label="Time Estimate (minutes)"
            type="number"
            value={timeEstimate}
            onChange={(e) => setTimeEstimate(e.target.value)}
            placeholder="30"
          />
        </div>

        {/* Context Tags */}
        <Input
          label="Context Tags"
          value={contextTags}
          onChange={(e) => setContextTags(e.target.value)}
          placeholder="deep-work, admin, calls (comma separated)"
        />

        {/* Add to Today */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inToday}
            onChange={(e) => setInToday(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-[#1a1a1a] text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Sun className="w-4 h-4 text-amber-500" />
            Add to Today
          </div>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#333333]">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
