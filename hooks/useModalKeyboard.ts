import { useEffect, useRef } from 'react';

/**
 * Hook for modal keyboard accessibility (WCAG 2.1.1, 2.4.3)
 * - Escape key closes the modal
 * - Stores and restores focus to the trigger element
 */
export function useModalKeyboard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}
