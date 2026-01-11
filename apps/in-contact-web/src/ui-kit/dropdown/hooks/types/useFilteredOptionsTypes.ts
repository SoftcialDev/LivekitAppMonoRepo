/**
 * @fileoverview useFilteredOptions hook type definitions
 * @summary Type definitions for useFilteredOptions hook
 */

export interface UseFilteredOptionsProps<Value> {
  /**
   * All available options
   */
  options: Array<{ label: string; value: Value }>;

  /**
   * Search term to filter by
   */
  searchTerm: string;

  /**
   * Whether data is currently loading (returns empty array if true)
   */
  isLoading?: boolean;
}

