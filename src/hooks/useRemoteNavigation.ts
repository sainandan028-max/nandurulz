/**
 * Custom hook for TV remote / keyboard navigation.
 * Manages focus state across a grid of focusable elements.
 */
import { useEffect, useCallback, useRef } from 'react';

interface UseRemoteNavigationOptions {
  /** CSS selector for focusable elements */
  selector?: string;
  /** Whether navigation is active */
  enabled?: boolean;
  /** Callback when Enter is pressed on focused element */
  onSelect?: (element: HTMLElement) => void;
  /** Callback when Back/Escape is pressed */
  onBack?: () => void;
  /** Container element ref */
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function useRemoteNavigation({
  selector = '[data-focusable]',
  enabled = true,
  onSelect,
  onBack,
  containerRef,
}: UseRemoteNavigationOptions = {}) {
  const focusIndexRef = useRef<number>(-1);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = containerRef?.current || document;
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }, [selector, containerRef]);

  const setFocusToElement = useCallback(
    (element: HTMLElement) => {
      const elements = getFocusableElements();
      const index = elements.indexOf(element);
      if (index >= 0) {
        focusIndexRef.current = index;
        element.focus({ preventScroll: false });
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    },
    [getFocusableElements]
  );

  const moveFocus = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const currentIndex = focusIndexRef.current;
      const currentElement = currentIndex >= 0 ? elements[currentIndex] : null;

      if (!currentElement) {
        // No element focused, focus first one
        focusIndexRef.current = 0;
        elements[0].focus();
        elements[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const currentRect = currentElement.getBoundingClientRect();
      let bestCandidate: HTMLElement | null = null;
      let bestScore = Infinity;

      for (let i = 0; i < elements.length; i++) {
        if (i === currentIndex) continue;
        const el = elements[i];
        const rect = el.getBoundingClientRect();

        const cx = currentRect.left + currentRect.width / 2;
        const cy = currentRect.top + currentRect.height / 2;
        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;

        const dx = ex - cx;
        const dy = ey - cy;

        let isValid = false;
        switch (direction) {
          case 'left':
            isValid = dx < -10;
            break;
          case 'right':
            isValid = dx > 10;
            break;
          case 'up':
            isValid = dy < -10;
            break;
          case 'down':
            isValid = dy > 10;
            break;
        }

        if (isValid) {
          // Score: prefer elements that are more aligned with the direction
          const distance = Math.sqrt(dx * dx + dy * dy);
          const alignment =
            direction === 'left' || direction === 'right'
              ? Math.abs(dy) * 2 // Penalize vertical offset for horizontal movement
              : Math.abs(dx) * 2; // Penalize horizontal offset for vertical movement

          const score = distance + alignment;

          if (score < bestScore) {
            bestScore = score;
            bestCandidate = el;
          }
        }
      }

      if (bestCandidate) {
        setFocusToElement(bestCandidate);
      }
    },
    [getFocusableElements, setFocusToElement]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus('down');
          break;
        case 'Enter':
          e.preventDefault();
          {
            const elements = getFocusableElements();
            const idx = focusIndexRef.current;
            if (idx >= 0 && idx < elements.length) {
              const el = elements[idx];
              if (onSelect) {
                onSelect(el);
              } else {
                el.click();
              }
            }
          }
          break;
        case 'Escape':
        case 'Backspace':
          // Back button on Android TV remotes sends Backspace
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, moveFocus, getFocusableElements, onSelect, onBack]);

  return { moveFocus, setFocusToElement, getFocusableElements };
}
