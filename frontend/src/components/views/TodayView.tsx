import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Sun,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  Check,
} from 'lucide-react';
import { useStore } from '../../store';
import { TaskCard } from '../TaskCard';
import { Button, Modal, Input } from '../ui';
import type { Task, EnergyLevel } from '../../types';
import { isToday, parseISO } from 'date-fns';
import { ENERGY_COLORS } from '../../types';

interface TodayViewProps {
  onTaskClick: (taskId: string) => void;
}

export function TodayView({ onTaskClick }: TodayViewProps) {
  const { tasks, projects, settings, updateSettings, removeFromToday } = useStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState<EnergyLevel>('medium');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Get tasks for today
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.archived || t.completedAt) return false;

      // Manually added to today
      if (t.inToday) return true;

      // Due today (if setting enabled)
      if (settings.autoIncludeDueToday && t.dueDate) {
        return isToday(parseISO(t.dueDate));
      }

      // Scheduled for today
      if (t.scheduledDate) {
        return isToday(parseISO(t.scheduledDate));
      }

      return false;
    });
  }, [tasks, settings.autoIncludeDueToday]);

  // Sort by position (for drag & drop ordering)
  const sortedTodayTasks = useMemo(
    () => [...todayTasks].sort((a, b) => a.position - b.position),
    [todayTasks]
  );

  // Split into visible and overflow
  const visibleTasks = sortedTodayTasks.slice(0, settings.todayTaskLimit);
  const overflowTasks = sortedTodayTasks.slice(settings.todayTaskLimit);

  // Get tasks completed today
  const completedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      completed.setHours(0, 0, 0, 0);
      return completed.getTime() === today.getTime();
    });
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleRemoveFromToday = (taskId: string) => {
    removeFromToday(taskId);
  };

  const getProjectForTask = (task: Task) => {
    return task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Sun className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Today</h1>
              <p className="text-sm text-gray-500">
                {visibleTasks.length} of {settings.todayTaskLimit} tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Energy Level Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded-lg border border-[#333333]">
              <Zap className="w-4 h-4" style={{ color: ENERGY_COLORS[currentEnergy] }} />
              <select
                value={currentEnergy}
                onChange={(e) => setCurrentEnergy(e.target.value as EnergyLevel)}
                className="bg-transparent text-sm text-white outline-none"
              >
                <option value="low">Low Energy</option>
                <option value="medium">Medium Energy</option>
                <option value="high">High Energy</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Today's Tasks */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveId(e.active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {visibleTasks.map((task) => (
                  <div key={task.id} className="group relative">
                    <TaskCard
                      task={task}
                      project={getProjectForTask(task)}
                      onClick={() => onTaskClick(task.id)}
                      showProject
                    />
                    <button
                      onClick={() => handleRemoveFromToday(task.id)}
                      className="absolute right-2 top-2 p-1 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from today"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  project={getProjectForTask(activeTask)}
                  isDragging
                  showProject
                />
              )}
            </DragOverlay>
          </DndContext>

          {visibleTasks.length === 0 && (
            <div className="text-center py-12">
              <Sun className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No tasks for today</p>
              <p className="text-sm text-gray-600">
                Add tasks to your day or schedule them for today
              </p>
            </div>
          )}

          {/* Overflow Section */}
          {overflowTasks.length > 0 && (
            <div className="border-t border-[#262626] pt-4">
              <button
                onClick={() => setShowOverflow(!showOverflow)}
                className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors"
              >
                {showOverflow ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <AlertCircle className="w-4 h-4" />
                {overflowTasks.length} tasks over limit
              </button>

              {showOverflow && (
                <div className="mt-3 space-y-2 opacity-60">
                  {overflowTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={getProjectForTask(task)}
                      onClick={() => onTaskClick(task.id)}
                      showProject
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Today */}
          {completedToday.length > 0 && (
            <div className="border-t border-[#262626] pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-500">
                  {completedToday.length} completed today
                </span>
              </div>
              <div className="space-y-2 opacity-50">
                {completedToday.slice(0, 5).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={getProjectForTask(task)}
                    onClick={() => onTaskClick(task.id)}
                    showProject
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettings(false)}
          title="Today View Settings"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Task Limit"
              type="number"
              value={settings.todayTaskLimit}
              onChange={(e) =>
                updateSettings({ todayTaskLimit: parseInt(e.target.value) || 7 })
              }
              min={1}
              max={20}
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoIncludeDueToday}
                onChange={(e) =>
                  updateSettings({ autoIncludeDueToday: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-600 bg-[#1a1a1a] text-indigo-600"
              />
              <span className="text-sm text-gray-300">
                Auto-include tasks due today
              </span>
            </label>

            <div className="pt-4">
              <Button onClick={() => setShowSettings(false)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
