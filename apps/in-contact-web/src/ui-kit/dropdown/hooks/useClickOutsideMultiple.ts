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
      const targetElement = target as HTMLElement;

      // First, check if click is inside any of the referenced elements
      // This handles both regular rendering and portal rendering
      const clickedInside = refs.some((ref) => {
        if (!ref.current) return false;
        // Check if target is directly inside the ref
        if (ref.current.contains(target)) {
          return true;
        }
        // Also check if clicking on a button that's inside the ref (for portal scenarios)
        const button = targetElement.closest?.('button');
        if (button && ref.current.contains(button)) {
          return true;
        }
        // Check if any parent of target is inside the ref
        let parent = targetElement.parentElement;
        while (parent) {
          if (ref.current.contains(parent)) {
            return true;
          }
          parent = parent.parentElement;
        }
        return false;
      });

      if (clickedInside) {
        return; // Don't close menu if clicking inside any referenced element
      }

      // If click is outside all referenced elements, close the menu
      handler();
    };

    // Use bubble phase (not capture) so button handlers can execute first
    // This ensures buttons can handle their clicks before we check if we should close
    document.addEventListener('mousedown', handleClickOutside, false);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, false);
    };
  }, [refs, handler, enabled]);
}

