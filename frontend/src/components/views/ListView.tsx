import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../../store';
import { TaskCard } from '../TaskCard';
import { Button } from '../ui';
import { groupBy, sortBy } from '../../lib/utils';

type SortField = 'position' | 'title' | 'dueDate' | 'createdAt' | 'energyLevel';
type GroupField = 'none' | 'column' | 'energyLevel' | 'dueDate';

interface ListViewProps {
  projectId: string;
  onTaskClick: (taskId: string) => void;
}

export function ListView({ projectId, onTaskClick }: ListViewProps) {
  const { projects, tasks, setCurrentView } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const [sortField, setSortField] = useState<SortField>('position');
  const [sortAsc, setSortAsc] = useState(true);
  const [groupField, setGroupField] = useState<GroupField>('column');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId && !t.archived),
    [tasks, projectId]
  );

  const sortedTasks = useMemo(() => {
    const sorted = sortBy(projectTasks, (task) => {
      switch (sortField) {
        case 'title':
          return task.title;
        case 'dueDate':
          return task.dueDate || 'zzz';
        case 'createdAt':
          return task.createdAt;
        case 'energyLevel':
          return task.energyLevel || 'zzz';
        default:
          return task.position;
      }
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [projectTasks, sortField, sortAsc]);

  const groupedTasks = useMemo(() => {
    if (groupField === 'none') {
      return { '': sortedTasks };
    }

    return groupBy(sortedTasks, (task) => {
      switch (groupField) {
        case 'column':
          const col = project?.columns.find((c) => c.id === task.columnId);
          return col?.name || 'No Column';
        case 'energyLevel':
          return task.energyLevel
            ? `${task.energyLevel.charAt(0).toUpperCase() + task.energyLevel.slice(1)} Energy`
            : 'No Energy Level';
        case 'dueDate':
          if (!task.dueDate) return 'No Due Date';
          const date = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const taskDate = new Date(date);
          taskDate.setHours(0, 0, 0, 0);
          if (taskDate < today) return 'Overdue';
          if (taskDate.getTime() === today.getTime()) return 'Today';
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
          return 'Later';
        default:
          return '';
      }
    });
  }, [sortedTasks, groupField, project]);

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (!project) return null;

  const groupOrder =
    groupField === 'column'
      ? project.columns.map((c) => c.name)
      : Object.keys(groupedTasks);

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
            variant="ghost"
            size="sm"
            className="text-indigo-400"
          >
            <List className="w-4 h-4" />
            List
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentView('board')}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Group by:</span>
          <select
            value={groupField}
            onChange={(e) => setGroupField(e.target.value as GroupField)}
            className="px-2 py-1 text-sm bg-[#1a1a1a] border border-[#333333] rounded-lg text-white"
          >
            <option value="none">None</option>
            <option value="column">Column</option>
            <option value="energyLevel">Energy Level</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="px-2 py-1 text-sm bg-[#1a1a1a] border border-[#333333] rounded-lg text-white"
          >
            <option value="position">Position</option>
            <option value="title">Title</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created</option>
            <option value="energyLevel">Energy</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1 text-gray-500 hover:text-white rounded transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        <div className="ml-auto text-sm text-gray-500">
          {projectTasks.length} tasks
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {groupOrder.map((groupName) => {
            const groupTasks = groupedTasks[groupName] || [];
            if (groupTasks.length === 0) return null;

            const isCollapsed = collapsedGroups.has(groupName);

            return (
              <div key={groupName || 'ungrouped'}>
                {groupField !== 'none' && (
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {groupName}
                    <span className="text-gray-600">({groupTasks.length})</span>
                  </button>
                )}

                {!isCollapsed && (
                  <div className="space-y-2">
                    {groupTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        project={project}
                        onClick={() => onTaskClick(task.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {projectTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks in this project</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
