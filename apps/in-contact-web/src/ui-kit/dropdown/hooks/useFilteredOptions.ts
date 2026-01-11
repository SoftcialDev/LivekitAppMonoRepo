/**
 * @fileoverview useFilteredOptions hook
 * @summary Hook for filtering options by search term
 * @description Filters an array of options based on a search term (case-insensitive)
 */

import { useMemo } from 'react';
import type { UseFilteredOptionsProps } from './types/useFilteredOptionsTypes';

/**
 * Hook for filtering options by search term
 * 
 * Filters options based on a case-insensitive search term matching the label.
 * Returns empty array if isLoading is true.
 * 
 * @template Value The type of each option's value
 * @param props - Hook configuration
 * @returns Filtered array of options
 * 
 * @example
 * ```typescript
 * const filtered = useFilteredOptions({
 *   options: [{ label: 'Apple', value: 'apple' }, { label: 'Banana', value: 'banana' }],
 *   searchTerm: 'app',
 *   isLoading: false,
 * });
 * // Returns: [{ label: 'Apple', value: 'apple' }]
 * ```
 */
export function useFilteredOptions<Value>({
  options,
  searchTerm,
  isLoading = false,
}: UseFilteredOptionsProps<Value>): Array<{ label: string; value: Value }> {
  return useMemo(() => {
    if (isLoading) {
      return [];
    }

    const lowerTerm = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerTerm));
  }, [options, searchTerm, isLoading]);
}

