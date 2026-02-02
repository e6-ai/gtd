import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, Play, Zap, GripVertical, Check } from 'lucide-react';
import clsx from 'clsx';
import type { Task, Project } from '../types';
import { useStore } from '../store';
import { formatDate, formatTimeEstimate } from '../lib/utils';
import { ENERGY_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  project?: Project;
  onClick?: () => void;
  isDragging?: boolean;
  showProject?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  project,
  onClick,
  isDragging,
  showProject = false,
  compact = false,
}: TaskCardProps) {
  const { startTimer, activeTimer, completeTask } = useStore();
  const isTimerActive = activeTimer?.taskId === task.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTimer(task.id, task.projectId || undefined);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };

  const column = project?.columns.find((c) => c.id === task.columnId);
  const isDone = column?.countsAsDone || !!task.completedAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group bg-[#1a1a1a] border border-[#333333] rounded-lg transition-all',
        'hover:border-[#444444] hover:shadow-lg',
        dragging && 'opacity-50 shadow-2xl scale-105',
        isDone && 'opacity-60',
        compact ? 'p-2' : 'p-3'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Checkbox */}
        <button
          onClick={handleComplete}
          className={clsx(
            'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5',
            isDone
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-600 hover:border-indigo-500'
          )}
        >
          {isDone && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          <h4
            className={clsx(
              'text-sm font-medium cursor-pointer',
              isDone ? 'text-gray-500 line-through' : 'text-white'
            )}
          >
            {task.title}
          </h4>

          {!compact && task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {showProject && project && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs text-gray-500">{project.name}</span>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.timeEstimate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTimeEstimate(task.timeEstimate)}</span>
              </div>
            )}

            {task.energyLevel && (
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: ENERGY_COLORS[task.energyLevel] }}
              >
                <Zap className="w-3 h-3" />
                <span className="capitalize">{task.energyLevel}</span>
              </div>
            )}

            {task.contextTags.length > 0 && (
              <div className="flex items-center gap-1">
                {task.contextTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-xs bg-[#333333] text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {task.contextTags.length > 2 && (
                  <span className="text-xs text-gray-600">
                    +{task.contextTags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timer button */}
        {!isDone && (
          <button
            onClick={handleStartTimer}
            className={clsx(
              'p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100',
              isTimerActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:bg-[#333333] hover:text-white'
            )}
            title="Start timer"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
