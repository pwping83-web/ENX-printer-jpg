import { useEffect, useCallback } from 'react';

interface KeyboardShortcutActions {
  onUndo: () => void;
  onRedo: () => void;
  onSave: (format?: 'png' | 'jpg' | 'pdf') => void;
  onPrint: () => void;
  onPrintPreview: () => void;
  onReset: () => void;
  onToggleGridView: () => void;
  onToggleBorder: () => void;
  onOpenTutorial: () => void;
  onToggleShortcutsHelp: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isAuthenticated: boolean;
}

/**
 * Global keyboard shortcuts hook
 * 글로벌 키보드 단축키 훅
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onPrint,
  onPrintPreview,
  onReset,
  onToggleGridView,
  onToggleBorder,
  onOpenTutorial,
  onToggleShortcutsHelp,
  canUndo,
  canRedo,
  isAuthenticated,
}: KeyboardShortcutActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if not authenticated or in input/textarea
      if (!isAuthenticated) return;
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isEditing = tagName === 'input' || tagName === 'textarea' || target.isContentEditable;

      // Allow Ctrl+Z/Y even in inputs
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // ? key - Show shortcuts help (not in editing mode)
      if (e.key === '?' && !isEditing) {
        e.preventDefault();
        onToggleShortcutsHelp();
        return;
      }

      if (!isCtrlOrCmd) return;

      // Ctrl+Z - Undo
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey)) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      // Skip rest if editing
      if (isEditing) return;

      // Ctrl+S - Save PNG
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onSave('png');
        return;
      }

      // Ctrl+P - Print
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPrint();
        return;
      }

      // Ctrl+Shift+P - Print Preview
      if ((e.key === 'p' || e.key === 'P') && e.shiftKey) {
        e.preventDefault();
        onPrintPreview();
        return;
      }

      // Ctrl+G - Toggle Grid View
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        onToggleGridView();
        return;
      }

      // Ctrl+B - Toggle Border
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onToggleBorder();
        return;
      }

      // Ctrl+H - Tutorial/Help
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onOpenTutorial();
        return;
      }
    },
    [
      onUndo,
      onRedo,
      onSave,
      onPrint,
      onPrintPreview,
      onReset,
      onToggleGridView,
      onToggleBorder,
      onOpenTutorial,
      onToggleShortcutsHelp,
      canUndo,
      canRedo,
      isAuthenticated,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Keyboard shortcuts data for help display
 * 단축키 도움말 데이터
 */
export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], description: '되돌리기 (Undo)', category: '편집' },
  { keys: ['Ctrl', 'Y'], description: '앞으로 (Redo)', category: '편집' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: '앞으로 (Redo)', category: '편집' },
  { keys: ['Ctrl', 'S'], description: 'PDF 저장', category: '파일' },
  { keys: ['Ctrl', 'P'], description: '인쇄', category: '파일' },
  { keys: ['Ctrl', 'G'], description: '전체보기 전환', category: '보기' },
  { keys: ['Ctrl', 'B'], description: '테두리 그리기 전환', category: '보기' },
  { keys: ['Ctrl', 'H'], description: '사용 설명서', category: '도움' },
  { keys: ['?'], description: '단축키 도움말', category: '도움' },
  { keys: ['Esc'], description: '닫기', category: '도움' },
];