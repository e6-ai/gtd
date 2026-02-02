import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Inbox,
  Sun,
  Plus,
  Clock,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setCurrentView,
    setSelectedProject,
    setQuickAddOpen,
    projects,
    tasks,
    startTimer,
    stopTimer,
    activeTimer,
  } = useStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      {
        id: 'new-task',
        label: 'New Task',
        description: 'Create a new task',
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          setCommandPaletteOpen(false);
          setQuickAddOpen(true);
        },
        keywords: ['add', 'create', 'task'],
      },
      {
        id: 'go-inbox',
        label: 'Go to Inbox',
        icon: <Inbox className="w-4 h-4" />,
        action: () => {
          setCurrentView('inbox');
          setSelectedProject(null);
          setCommandPaletteOpen(false);
        },
        keywords: ['inbox', 'capture'],
      },
      {
        id: 'go-today',
        label: 'Go to Today',
        icon: <Sun className="w-4 h-4" />,
        action: () => {
          setCurrentView('today');
          setSelectedProject(null);
          setCommandPaletteOpen(false);
        },
        keywords: ['today', 'focus'],
      },
    ];

    // Add project commands
    projects
      .filter((p) => !p.archived)
      .forEach((project) => {
        cmds.push({
          id: `go-project-${project.id}`,
          label: `Go to ${project.name}`,
          icon: (
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: project.color }}
            />
          ),
          action: () => {
            setSelectedProject(project.id);
            setCurrentView('board');
            setCommandPaletteOpen(false);
          },
          keywords: ['project', project.name.toLowerCase()],
        });
      });

    // Timer commands
    if (activeTimer) {
      cmds.push({
        id: 'stop-timer',
        label: 'Stop Timer',
        description: 'Stop the current timer',
        icon: <Clock className="w-4 h-4" />,
        action: () => {
          stopTimer();
          setCommandPaletteOpen(false);
        },
        keywords: ['timer', 'stop', 'time'],
      });
    }

    // Add task timer commands (for quick start)
    tasks
      .filter((t) => !t.archived && !t.completedAt)
      .slice(0, 5)
      .forEach((task) => {
        cmds.push({
          id: `timer-${task.id}`,
          label: `Start timer: ${task.title}`,
          icon: <Clock className="w-4 h-4" />,
          action: () => {
            startTimer(task.id, task.projectId || undefined);
            setCommandPaletteOpen(false);
          },
          keywords: ['timer', 'start', task.title.toLowerCase()],
        });
      });

    return cmds;
  }, [
    projects,
    tasks,
    activeTimer,
    setCurrentView,
    setSelectedProject,
    setCommandPaletteOpen,
    setQuickAddOpen,
    startTimer,
    stopTimer,
  ]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 10);

    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        setCommandPaletteOpen(false);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-[#1a1a1a] rounded-xl shadow-2xl border border-[#333333] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
            autoComplete="off"
          />
          <kbd className="text-xs text-gray-600 bg-[#262626] px-1.5 py-0.5 rounded">esc</kbd>
        </div>

        {/* Commands list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-indigo-600/20 text-white'
                    : 'text-gray-400 hover:bg-[#262626] hover:text-white'
                )}
              >
                <span className="text-gray-500">{cmd.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{cmd.label}</div>
                  {cmd.description && (
                    <div className="text-xs text-gray-500">{cmd.description}</div>
                  )}
                </div>
                {index === selectedIndex && (
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
