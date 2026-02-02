import { useEffect } from 'react';
import { useStore } from '../store';

export function useKeyboardShortcuts() {
  const {
    setQuickAddOpen,
    setCommandPaletteOpen,
    setCurrentView,
    setSelectedProject,
    isQuickAddOpen,
    isCommandPaletteOpen,
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to close modals even from inputs
        if (e.key === 'Escape') {
          if (isQuickAddOpen) {
            e.preventDefault();
            setQuickAddOpen(false);
            return;
          }
          if (isCommandPaletteOpen) {
            e.preventDefault();
            setCommandPaletteOpen(false);
            return;
          }
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N - Quick Add
      if (isMod && e.key === 'n') {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }

      // Cmd/Ctrl + K - Command Palette
      if (isMod && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Escape - Close modals
      if (e.key === 'Escape') {
        if (isQuickAddOpen) {
          setQuickAddOpen(false);
          return;
        }
        if (isCommandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
      }

      // Number keys for navigation (without modifier)
      if (!isMod && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setCurrentView('today');
            setSelectedProject(null);
            break;
          case '2':
            e.preventDefault();
            setCurrentView('inbox');
            setSelectedProject(null);
            break;
        }
      }

      // G + key for "go to" shortcuts
      // This would need state to track if 'g' was pressed
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setQuickAddOpen,
    setCommandPaletteOpen,
    setCurrentView,
    setSelectedProject,
    isQuickAddOpen,
    isCommandPaletteOpen,
  ]);
}
