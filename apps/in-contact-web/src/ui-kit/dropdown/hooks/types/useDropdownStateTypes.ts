/**
 * @fileoverview useDropdownState hook type definitions
 * @summary Type definitions for useDropdownState hook
 */

export interface UseDropdownStateReturn {
  /**
   * Whether the dropdown is currently open
   */
  isOpen: boolean;

  /**
   * Open the dropdown
   */
  open: () => void;

  /**
   * Close the dropdown
   */
  close: () => void;

  /**
   * Toggle the dropdown open/closed state
   */
  toggle: () => void;
}

