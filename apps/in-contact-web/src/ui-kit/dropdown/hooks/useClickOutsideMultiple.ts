/**
 * @fileoverview useClickOutsideMultiple hook
 * @summary Hook for detecting clicks outside multiple elements (e.g., container + portal menu)
 * @description Enhanced version of useClickOutside that supports multiple refs for portal rendering scenarios
 */

import { useEffect } from 'react';
import type { UseClickOutsideMultipleProps } from './types/useClickOutsideMultipleTypes';

/**
 * Hook for detecting clicks outside multiple referenced elements
 * 
 * Enhanced version of useClickOutside that supports multiple refs.
 * Useful when a dropdown menu is rendered in a portal (separate DOM node).
 * 
 * @param props - Hook configuration
 * 
 * @example
 * ```typescript
 * const containerRef = useRef<HTMLDivElement>(null);
 * const menuRef = useRef<HTMLDivElement>(null);
 * useClickOutsideMultiple({
 *   refs: [containerRef, menuRef],
 *   handler: () => setIsOpen(false),
 *   enabled: isOpen,
 * });
 * ```
 */
export function useClickOutsideMultiple({
  refs,
  handler,
  enabled = true,
}: UseClickOutsideMultipleProps): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    /**
     * Handles click events outside all referenced elements
     * 
     * @param event - Mouse event
     */
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;

      // Check if click is on a button inside any of the referenced elements
      // This allows buttons to be clickable even if they're in a portal
      const clickedOnButton = (target as HTMLElement).closest?.('button') !== null;
      if (clickedOnButton) {
        // If clicking on a button, check if it's inside any referenced element
        const buttonParent = (target as HTMLElement).closest('button')?.parentElement;
        const clickedInside = refs.some((ref) => {
          return ref.current?.contains(target) || ref.current?.contains(buttonParent as Node);
        });
        if (clickedInside) {
          return; // Don't close menu if clicking on a button inside
        }
      }

      // Check if click is inside any of the referenced elements
      const clickedInside = refs.some((ref) => {
        return ref.current?.contains(target);
      });

      if (!clickedInside) {
        handler();
      }
    };

    // Use capture phase to check before other handlers, but allow buttons to work
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [refs, handler, enabled]);
}

