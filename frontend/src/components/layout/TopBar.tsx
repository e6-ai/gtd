import { useState, useEffect } from 'react';
import { Square, Search } from 'lucide-react';
import { useStore } from '../../store';
import { formatDuration } from '../../lib/utils';

export function TopBar() {
  const { activeTimer, stopTimer, tasks, projects, setCommandPaletteOpen } = useStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(activeTimer.startTime).getTime();
    setElapsed(Date.now() - startTime);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const activeTask = activeTimer?.taskId
    ? tasks.find((t) => t.id === activeTimer.taskId)
    : null;
  const activeProject = activeTimer?.projectId
    ? projects.find((p) => p.id === activeTimer.projectId)
    : null;

  return (
    <header className="h-14 bg-[#0f0f0f] border-b border-[#262626] flex items-center justify-between px-4">
      {/* Search / Command Palette */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-500 bg-[#1a1a1a] hover:bg-[#262626] rounded-lg border border-[#333333] transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search or command...</span>
        <div className="flex items-center gap-1">
          <kbd className="text-xs bg-[#262626] px-1.5 py-0.5 rounded">⌘</kbd>
          <kbd className="text-xs bg-[#262626] px-1.5 py-0.5 rounded">K</kbd>
        </div>
      </button>

      {/* Timer */}
      {activeTimer ? (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-indigo-300">
              {formatDuration(elapsed)}
            </span>
          </div>

          {activeTask && (
            <span className="text-sm text-gray-400 max-w-48 truncate">
              {activeTask.title}
            </span>
          )}
          {!activeTask && activeProject && (
            <span className="text-sm text-gray-400 max-w-48 truncate">
              {activeProject.name}
            </span>
          )}

          <button
            onClick={() => stopTimer()}
            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Stop timer"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-600">No active timer</div>
      )}
    </header>
  );
}
