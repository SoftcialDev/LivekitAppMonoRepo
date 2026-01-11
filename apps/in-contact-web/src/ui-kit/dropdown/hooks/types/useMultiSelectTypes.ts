/**
 * @fileoverview useMultiSelect hook type definitions
 * @summary Type definitions for useMultiSelect hook
 */

export interface UseMultiSelectProps<Value> {
  /**
   * Currently selected values
   */
  selectedValues: Value[];

  /**
   * Callback when selection changes
   */
  onSelectionChange: (values: Value[]) => void;

  /**
   * Whether to close dropdown after selection (for toggle operation)
   */
  closeOnSelect?: boolean;

  /**
   * Callback to close the dropdown (required if closeOnSelect is true)
   */
  onClose?: () => void;
}

export interface UseMultiSelectReturn<Value> {
  /**
   * Toggle inclusion of a value in selection
   */
  toggle: (value: Value) => void;

  /**
   * Clear all selections
   */
  clearAll: () => void;

  /**
   * Select all values from the provided array
   */
  selectAll: (values: Value[]) => void;

  /**
   * Check if a value is selected
   */
  isSelected: (value: Value) => boolean;
}

