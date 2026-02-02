import {
  Inbox,
  Sun,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useStore } from '../../store';
import type { ViewType } from '../../types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
        active
          ? 'bg-indigo-600/20 text-indigo-400'
          : 'text-gray-400 hover:bg-[#262626] hover:text-white'
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={clsx(
            'px-2 py-0.5 text-xs rounded-full',
            active ? 'bg-indigo-600/30' : 'bg-[#333333]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const {
    currentView,
    setCurrentView,
    selectedProjectId,
    setSelectedProject,
    projects,
    tasks,
    setQuickAddOpen,
  } = useStore();

  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const inboxCount = tasks.filter((t) => !t.projectId && !t.archived).length;
  const todayCount = tasks.filter((t) => t.inToday && !t.archived && !t.completedAt).length;

  const activeProjects = projects.filter((p) => !p.archived);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'board' && view !== 'list') {
      setSelectedProject(null);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentView('board');
  };

  return (
    <aside className="w-64 bg-[#0f0f0f] border-r border-[#262626] flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-semibold text-white">GTD</span>
        </div>
      </div>

      {/* Quick Add */}
      <div className="p-3">
        <button
          onClick={() => setQuickAddOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 bg-[#1a1a1a] hover:bg-[#262626] hover:text-white rounded-lg border border-[#333333] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add</span>
          <kbd className="ml-auto text-xs text-gray-600 bg-[#262626] px-1.5 py-0.5 rounded">⌘N</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavItem
          icon={<Inbox className="w-4 h-4" />}
          label="Inbox"
          count={inboxCount}
          active={currentView === 'inbox'}
          onClick={() => handleViewChange('inbox')}
        />
        <NavItem
          icon={<Sun className="w-4 h-4" />}
          label="Today"
          count={todayCount}
          active={currentView === 'today'}
          onClick={() => handleViewChange('today')}
        />

        {/* Divider */}
        <div className="py-3">
          <div className="border-t border-[#262626]" />
        </div>

        {/* Projects */}
        <div>
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
          >
            {projectsExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Projects
          </button>

          {projectsExpanded && (
            <div className="space-y-0.5 mt-1">
              {activeProjects.map((project) => {
                const projectTaskCount = tasks.filter(
                  (t) => t.projectId === project.id && !t.archived && !t.completedAt
                ).length;

                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                      selectedProjectId === project.id
                        ? 'bg-indigo-600/20 text-indigo-400'
                        : 'text-gray-400 hover:bg-[#262626] hover:text-white'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    {projectTaskCount > 0 && (
                      <span className="text-xs text-gray-600">{projectTaskCount}</span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  const project = useStore.getState().addProject({
                    name: 'New Project',
                    color: '#6366f1',
                    columns: [],
                    defaultView: 'board',
                    archived: false,
                  });
                  setSelectedProject(project.id);
                  setCurrentView('board');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#262626]">
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          active={false}
          onClick={() => {}}
        />
      </div>
    </aside>
  );
}
