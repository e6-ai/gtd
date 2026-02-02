import { useEffect, useState } from 'react';
import { useStore } from './store';
import { useKeyboardShortcuts } from './hooks';
import { Sidebar, TopBar } from './components/layout';
import { TodayView, InboxView, BoardView, ListView } from './components/views';
import { QuickAddModal, TaskEditModal, CommandPalette } from './components/modals';

function App() {
  const {
    loadFromStorage,
    currentView,
    selectedProjectId,
    selectedTaskId,
    setSelectedTask,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB on mount
  useEffect(() => {
    loadFromStorage().then(() => setIsLoading(false));
  }, [loadFromStorage]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts();

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
  };

  const handleCloseTaskEdit = () => {
    setSelectedTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (currentView) {
      case 'today':
        return <TodayView onTaskClick={handleTaskClick} />;
      case 'inbox':
        return <InboxView onTaskClick={handleTaskClick} />;
      case 'board':
        if (selectedProjectId) {
          return (
            <BoardView projectId={selectedProjectId} onTaskClick={handleTaskClick} />
          );
        }
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a project to view
          </div>
        );
      case 'list':
        if (selectedProjectId) {
          return (
            <ListView projectId={selectedProjectId} onTaskClick={handleTaskClick} />
          );
        }
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a project to view
          </div>
        );
      default:
        return <TodayView onTaskClick={handleTaskClick} />;
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#0f0f0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden">{renderMainContent()}</main>
      </div>

      {/* Modals */}
      <QuickAddModal />
      <CommandPalette />
      {selectedTaskId && (
        <TaskEditModal taskId={selectedTaskId} onClose={handleCloseTaskEdit} />
      )}
    </div>
  );
}

export default App;
