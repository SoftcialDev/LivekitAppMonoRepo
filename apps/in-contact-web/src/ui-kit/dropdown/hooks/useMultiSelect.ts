/**
 * @fileoverview useMultiSelect hook
 * @summary Hook for managing multi-select state and operations
 * @description Handles toggle, clear all, and select all operations for multi-select scenarios
 */

import { useCallback } from 'react';
import type {
  UseMultiSelectProps,
  UseMultiSelectReturn,
} from './types/useMultiSelectTypes';

/**
 * Hook for managing multi-select state and operations
 * 
 * Provides toggle, clear all, and select all operations for multi-select scenarios.
 * 
 * @template Value The type of each selectable value
 * @param props - Hook configuration
 * @returns Object with selection operations
 * 
 * @example
 * ```typescript
 * const { toggle, clearAll, selectAll, isSelected } = useMultiSelect({
 *   selectedValues: ['a', 'b'],
 *   onSelectionChange: setSelectedValues,
 *   closeOnSelect: false,
 * });
 * 
 * toggle('c'); // Adds 'c' to selection
 * toggle('a'); // Removes 'a' from selection
 * clearAll(); // Clears all selections
 * selectAll(['x', 'y', 'z']); // Selects all provided values
 * ```
 */
export function useMultiSelect<Value>({
  selectedValues,
  onSelectionChange,
  closeOnSelect = false,
  onClose,
}: UseMultiSelectProps<Value>): UseMultiSelectReturn<Value> {
  const toggle = useCallback(
    (value: Value) => {
      if (selectedValues.includes(value)) {
        onSelectionChange(selectedValues.filter((v) => v !== value));
      } else {
        onSelectionChange([...selectedValues, value]);
      }

      if (closeOnSelect && onClose) {
        onClose();
      }
    },
    [selectedValues, onSelectionChange, closeOnSelect, onClose]
  );

  const clearAll = useCallback(() => {
    onSelectionChange([]);
    if (onClose) {
      onClose();
    }
  }, [onSelectionChange, onClose]);

  const selectAll = useCallback(
    (values: Value[]) => {
      // Combine existing selections with all provided values (avoiding duplicates)
      const newSelection = [...new Set([...selectedValues, ...values])];
      onSelectionChange(newSelection);
    },
    [selectedValues, onSelectionChange]
  );

  const isSelected = useCallback(
    (value: Value) => {
      return selectedValues.includes(value);
    },
    [selectedValues]
  );

  return { toggle, clearAll, selectAll, isSelected };
}

