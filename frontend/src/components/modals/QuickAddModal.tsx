import { useState, useEffect, useRef } from 'react';
import { Inbox } from 'lucide-react';
import { useStore } from '../../store';

export function QuickAddModal() {
  const { isQuickAddOpen, setQuickAddOpen, addTask, projects, selectedProjectId } = useStore();
  const [title, setTitle] = useState('');
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      setTitle('');
      setTargetProjectId(selectedProjectId);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isQuickAddOpen, selectedProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const project = targetProjectId ? projects.find((p) => p.id === targetProjectId) : null;
    const firstColumn = project?.columns[0];

    addTask({
      title: title.trim(),
      projectId: targetProjectId,
      columnId: firstColumn?.id || null,
      contextTags: [],
      inToday: false,
      archived: false,
    });

    setQuickAddOpen(false);
  };

  if (!isQuickAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setQuickAddOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-[#1a1a1a] rounded-xl shadow-2xl border border-[#333333] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-lg bg-transparent border-none outline-none text-white placeholder-gray-500"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-t border-[#262626]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Add to:</span>
              <button
                type="button"
                onClick={() => setTargetProjectId(null)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-colors ${
                  !targetProjectId
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-gray-400 hover:bg-[#262626]'
                }`}
              >
                <Inbox className="w-3 h-3" />
                Inbox
              </button>

              {projects.filter((p) => !p.archived).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setTargetProjectId(project.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-colors ${
                    targetProjectId === project.id
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:bg-[#262626]'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
