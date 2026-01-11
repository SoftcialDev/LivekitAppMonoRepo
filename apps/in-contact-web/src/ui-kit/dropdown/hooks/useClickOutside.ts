/**
 * @fileoverview useClickOutside hook
 * @summary Hook for detecting clicks outside an element
 * @description Listens for mouse clicks outside a referenced element and triggers a callback
 */

import { useEffect, type RefObject } from 'react';

/**
 * Hook for detecting clicks outside a referenced element
 * 
 * Adds an event listener to the document that detects when the user clicks
 * outside the referenced element. When a click outside is detected, the
 * provided handler function is called.
 * 
 * @param ref - React ref to the element to detect clicks outside of
 * @param handler - Callback function to execute when click outside is detected
 * 
 * @example
 * ```typescript
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false));
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void
): void {
  useEffect(() => {
    /**
     * Handles click events outside the referenced element
     * 
     * @param event - Mouse event
     */
    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
}

