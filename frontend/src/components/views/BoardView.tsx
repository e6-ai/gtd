import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Edit2, Trash2, List, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store';
import { TaskCard } from '../TaskCard';
import { Button, Input, Modal } from '../ui';
import type { Task, Column } from '../../types';

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  projectId: string;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
}

function BoardColumn({
  column,
  tasks,
  projectId,
  onEditColumn,
  onDeleteColumn,
  onTaskClick,
}: BoardColumnProps) {
  const { addTask } = useStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      projectId,
      columnId: column.id,
      contextTags: [],
      inToday: false,
      archived: false,
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.position - b.position),
    [tasks]
  );

  const wipExceeded = column.wipLimit && tasks.length > column.wipLimit;

  return (
    <div className="flex-shrink-0 w-80 bg-[#141414] rounded-xl border border-[#262626] flex flex-col max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-white text-sm">{column.name}</h3>
          <span
            className={clsx(
              'text-xs px-1.5 py-0.5 rounded',
              wipExceeded
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[#262626] text-gray-500'
            )}
          >
            {tasks.length}
            {column.wipLimit && `/${column.wipLimit}`}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-500 hover:text-white hover:bg-[#262626] rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-40 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl py-1">
                <button
                  onClick={() => {
                    onEditColumn(column);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-[#262626] hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Column
                </button>
                <button
                  onClick={() => {
                    onDeleteColumn(column.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Column
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <SortableContext
          items={sortedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              compact
            />
          ))}
        </SortableContext>

        {/* Add Task */}
        {isAddingTask ? (
          <div className="p-2 bg-[#1a1a1a] rounded-lg border border-[#333333]">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setIsAddingTask(false);
              }}
              placeholder="Task title..."
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleAddTask}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddingTask(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center gap-2 p-2 text-sm text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}

interface BoardViewProps {
  projectId: string;
  onTaskClick: (taskId: string) => void;
}

export function BoardView({ projectId, onTaskClick }: BoardViewProps) {
  const { projects, tasks, updateTask, addColumn, updateColumn, deleteColumn, reorderTasks, setCurrentView } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6366f1');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId && !t.archived),
    [tasks, projectId]
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (!project) return null;

  const sortedColumns = [...project.columns].sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dragging over a column
    const overColumn = project.columns.find((c) => c.id === over.id);
    if (overColumn && activeTask.columnId !== overColumn.id) {
      updateTask(activeTask.id, { columnId: overColumn.id });
      return;
    }

    // Check if dragging over another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTask.id !== overTask.id) {
      // Move to the same column as the target task
      if (activeTask.columnId !== overTask.columnId) {
        updateTask(activeTask.id, { columnId: overTask.columnId });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Get all tasks in the target column
    const columnTasks = projectTasks
      .filter((t) => t.columnId === activeTask.columnId)
      .sort((a, b) => a.position - b.position);

    const activeIndex = columnTasks.findIndex((t) => t.id === active.id);
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);

    if (activeIndex !== overIndex && overIndex !== -1) {
      const newOrder = [...columnTasks];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeTask);
      reorderTasks(
        newOrder.map((t) => t.id),
        activeTask.columnId
      );
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    addColumn(projectId, {
      name: newColumnName.trim(),
      color: newColumnColor,
      countsAsDone: false,
    });
    setNewColumnName('');
    setNewColumnColor('#6366f1');
    setIsAddingColumn(false);
  };

  const handleSaveColumn = () => {
    if (!editingColumn) return;
    updateColumn(projectId, editingColumn.id, {
      name: editingColumn.name,
      color: editingColumn.color,
      countsAsDone: editingColumn.countsAsDone,
      wipLimit: editingColumn.wipLimit,
    });
    setEditingColumn(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (confirm('Delete this column? Tasks will be moved to the first column.')) {
      deleteColumn(projectId, columnId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-xl font-semibold text-white">{project.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentView('list')}
          >
            <List className="w-4 h-4" />
            List
          </Button>
          <Button variant="ghost" size="sm" className="text-indigo-400">
            <LayoutGrid className="w-4 h-4" />
            Board
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {sortedColumns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={projectTasks.filter((t) => t.columnId === column.id)}
                projectId={projectId}
                onEditColumn={setEditingColumn}
                onDeleteColumn={handleDeleteColumn}
                onTaskClick={onTaskClick}
              />
            ))}

            {/* Add Column */}
            {isAddingColumn ? (
              <div className="flex-shrink-0 w-80 p-4 bg-[#141414] rounded-xl border border-[#333333]">
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Column name"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="color"
                    value={newColumnColor}
                    onChange={(e) => setNewColumnColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">Color</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={handleAddColumn}>
                    Add Column
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAddingColumn(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="flex-shrink-0 w-80 h-12 flex items-center justify-center gap-2 text-gray-500 hover:text-white bg-[#141414]/50 hover:bg-[#141414] border border-dashed border-[#333333] rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
            )}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isDragging compact />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Column Modal */}
      {editingColumn && (
        <Modal
          isOpen={true}
          onClose={() => setEditingColumn(null)}
          title="Edit Column"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={editingColumn.name}
              onChange={(e) =>
                setEditingColumn({ ...editingColumn, name: e.target.value })
              }
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={editingColumn.color}
                onChange={(e) =>
                  setEditingColumn({ ...editingColumn, color: e.target.value })
                }
                className="w-10 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-400">Color</span>
            </div>
            <Input
              label="WIP Limit (optional)"
              type="number"
              value={editingColumn.wipLimit || ''}
              onChange={(e) =>
                setEditingColumn({
                  ...editingColumn,
                  wipLimit: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="No limit"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingColumn.countsAsDone}
                onChange={(e) =>
                  setEditingColumn({
                    ...editingColumn,
                    countsAsDone: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-600 bg-[#1a1a1a] text-indigo-600"
              />
              <span className="text-sm text-gray-300">Counts as done</span>
            </label>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setEditingColumn(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveColumn}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
