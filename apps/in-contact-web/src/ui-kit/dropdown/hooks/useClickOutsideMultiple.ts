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

      // Check if click is inside any of the referenced elements
      const clickedInside = refs.some((ref) => {
        return ref.current?.contains(target);
      });

      if (!clickedInside) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, handler, enabled]);
}

