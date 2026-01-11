/**
 * @fileoverview Table utility functions
 * @summary Reusable utilities for table data manipulation
 * @description Common utility functions for filtering, merging, and manipulating
 * table data. These utilities are used across table components to ensure consistent
 * behavior and avoid code duplication.
 */

import type { IColumn } from '../types';

/**
 * Filters an array of data based on a search term and column definitions
 * 
 * Searches through all specified column keys in the data rows and returns
 * rows that contain the search term (case-insensitive) in any of the columns.
 * 
 * @template T Type of each row data object
 * @param data - Array of data rows to filter
 * @param columns - Column definitions to search through
 * @param searchTerm - Search term to match (case-insensitive)
 * @returns Filtered array containing only rows that match the search term
 * 
 * @example
 * ```typescript
 * const filtered = filterTableData(users, columns, 'john');
 * // Returns users where any column contains 'john' (case-insensitive)
 * ```
 */
export function filterTableData<T>(
  data: T[],
  columns: IColumn<T>[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) {
    return data;
  }

  const normalizedTerm = searchTerm.toLowerCase();

  return data.filter(row =>
    columns.some(col => {
      if (!col.key) {
        return false;
      }

      const cell = typeof col.key === 'string'
        ? (row as Record<string, unknown>)[col.key]
        : row[col.key as keyof T];

      return (
        cell != null &&
        String(cell).toLowerCase().includes(normalizedTerm)
      );
    })
  );
}

/**
 * Merges new data into existing data array, avoiding duplicates based on ID
 * 
 * Compares items by their `id` property (or converts to string for comparison)
 * and only adds items that don't already exist in the existing array. This is
 * useful for incremental data loading where new batches might overlap with
 * previously loaded data.
 * 
 * @template T Type of each item (must have id?: string)
 * @param existing - Existing array of items
 * @param newItems - New items to merge in
 * @returns New array with merged items (no duplicates)
 * 
 * @example
 * ```typescript
 * const merged = mergeDataWithoutDuplicates(
 *   [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
 *   [{ id: '2', name: 'B' }, { id: '3', name: 'C' }]
 * );
 * // Returns [{ id: '1', name: 'A' }, { id: '2', name: 'B' }, { id: '3', name: 'C' }]
 * ```
 */
export function mergeDataWithoutDuplicates<T extends { id?: string }>(
  existing: T[],
  newItems: T[]
): T[] {
  const existingIds = new Set(existing.map(item => item.id || String(item)));
  
  const uniqueNewItems = newItems.filter(item => {
    const id = item.id || String(item);
    return !existingIds.has(id);
  });

  return [...existing, ...uniqueNewItems];
}

/**
 * Calculates pagination slice indices for a given page and page size
 * 
 * Computes the start and end indices for slicing an array to display
 * a specific page of results. Useful for client-side pagination.
 * 
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Object with startIndex and endIndex for array slicing
 * 
 * @example
 * ```typescript
 * const { startIndex, endIndex } = calculatePageIndices(2, 10);
 * // Returns { startIndex: 10, endIndex: 20 }
 * const pageData = allData.slice(startIndex, endIndex);
 * ```
 */
export function calculatePageIndices(page: number, pageSize: number): {
  startIndex: number;
  endIndex: number;
} {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return { startIndex, endIndex };
}

