/**
 * @fileoverview useDropdownState hook
 * @summary Hook for managing dropdown open/close state
 * @description Manages the open/close state of a dropdown with controlled and uncontrolled options
 */

import { useState, useCallback } from 'react';
import type { UseDropdownStateReturn } from './types/useDropdownStateTypes';

/**
 * Hook for managing dropdown open/close state
 * 
 * Provides simple state management for dropdown visibility.
 * 
 * @param initialOpen - Initial open state
 * @returns Object with isOpen state and control functions
 * 
 * @example
 * ```typescript
 * const { isOpen, open, close, toggle } = useDropdownState(false);
 * ```
 */
export function useDropdownState(initialOpen = false): UseDropdownStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, open, close, toggle };
}

