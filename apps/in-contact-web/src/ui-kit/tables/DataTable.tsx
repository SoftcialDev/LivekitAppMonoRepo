/**
 * @fileoverview DataTable - Composite table component with incremental loading
 * @summary Combines TableComponent, TablePagination, and search with smart data loading
 * @description Implements incremental data loading strategy: loads initial batch (80 records),
 * displays 8 per page, and automatically fetches more data when navigating to pages that
 * require data not yet loaded. Calculates total pages based on total count from API.
 * 
 * The component manages data loading, pagination, and search internally. It automatically
 * fetches additional data when needed, merges it with existing data, and handles both
 * internal and external search patterns.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TableComponent } from './TableComponent';
import { TablePagination } from './TablePagination';
import type { IDataTableProps } from './types';
import { filterTableData, mergeDataWithoutDuplicates, calculatePageIndices } from './utils/tableUtils';
import { logError } from '@/shared/utils/logger';

/**
 * DataTable component with incremental loading, pagination, and search
 * 
 * A composite table component that combines table rendering, incremental data loading,
 * client-side pagination, and search functionality. It automatically manages data fetching,
 * merging, and state to provide a seamless user experience.
 * 
 * Incremental Loading Strategy:
 * 1. Initial load: fetches `initialFetchSize` records (default: 80) from the API
 * 2. Display: shows `pageSize` records per page (default: 8) in the table
 * 3. Total pages: calculated from API `totalCount` / `pageSize`, always shows accurate total
 * 4. Incremental fetch: when navigating to a page that requires data beyond currently
 *    loaded range, automatically fetches additional `fetchSize` records from the API
 * 
 * The component handles duplicate detection when merging new data with existing data,
 * ensuring data integrity even if API responses overlap.
 * 
 * @template T Row data type (must have optional `id?: string` property)
 * @param props - Component configuration props
 * @returns JSX element containing table, toolbar, pagination controls, and search input
 * 
 * @example
 * ```typescript
 * <DataTable<ErrorLog>
 *   columns={errorLogColumns}
 *   dataLoader={{
 *     initialFetchSize: 80,
 *     fetchSize: 80,
 *     totalCount: 180,
 *     onFetch: async (limit, offset) => {
 *       const response = await getErrorLogs({ limit, offset });
 *       return { data: response.data, totalCount: response.totalCount };
 *     }
 *   }}
 *   selection={{
 *     selectedKeys,
 *     onToggleRow,
 *     onToggleAll,
 *     getRowKey: (row) => row.id
 *   }}
 *   search={{ enabled: true, placeholder: 'Search error logs...' }}
 *   pageSize={8}
 * />
 * ```
 */
export function DataTable<T extends { id?: string }>(
  {
    columns,
    dataLoader,
    selection,
    search = { enabled: true },
    pageSize = 8,
    leftToolbarActions,
    rightToolbarActions,
    headerBg,
    tablePadding,
    externalLoading,
    externalLoadingAction = 'Loading data',
    customFilter,
  }: Readonly<IDataTableProps<T>>
): JSX.Element {
  const {
    initialFetchSize = 80,
    fetchSize = 80,
    onFetch,
    totalCount,
  } = dataLoader;

  const [allData, setAllData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Determines if more data needs to be fetched for the specified page
   * 
   * Checks if the requested page requires data that hasn't been loaded yet.
   * This happens when the page's data range extends beyond the currently
   * loaded data, but there's still more data available from the API.
   * 
   * @param page - Page number (1-based) to check
   * @returns True if additional data needs to be fetched, false otherwise
   */
  const needsMoreData = useCallback((page: number): boolean => {
    const { endIndex } = calculatePageIndices(page, pageSize);
    
    // Need more data if the page requires data beyond what's loaded
    // and there's still more data available from the API
    // totalCount can be undefined (not loaded yet) or a number (loaded)
    return endIndex > allData.length && totalCount !== undefined && allData.length < totalCount;
  }, [allData.length, pageSize, totalCount]);

  /**
   * Fetches data incrementally from the API and merges with existing data
   * 
   * Calls the provided `onFetch` function to retrieve data from the API,
   * then merges the new data with existing data while avoiding duplicates.
   * The merge operation uses item IDs to identify and prevent duplicate entries.
   * 
   * @param offset - Starting offset for the fetch (0-based)
   * @param limit - Number of records to fetch
   * @returns Promise that resolves when the fetch and merge operation completes
   * 
   * @remarks
   * Errors are logged but not re-thrown, as error handling should be done
   * by the parent component through the `onFetch` callback. The loading state
   * is managed internally to provide immediate UI feedback.
   */
  const fetchData = useCallback(async (offset: number, limit: number): Promise<void> => {
    setLoading(true);
    try {
      const response = await onFetch(limit, offset);
      const newData = response.data as T[];
      
      // Merge with existing data, avoiding duplicates
      setAllData(prev => mergeDataWithoutDuplicates(prev, newData));
    } catch (error) {
      // Error handling is done by parent component via onFetch callback
      // Log the error for debugging purposes
      logError(error, {
        component: 'DataTable',
        operation: 'fetchData',
        offset,
        limit,
      });
    } finally {
      setLoading(false);
    }
  }, [onFetch]);

  /**
   * Initial data load effect
   * 
   * Triggers the initial data fetch when:
   * - Component mounts and totalCount is available (> 0)
   * - totalCount changes from undefined to a number (0 or > 0)
   * 
   * Only fetches if no data has been loaded yet and we're not currently loading.
   * Waits for totalCount to be defined before fetching to avoid showing "no results" prematurely.
   */
  useEffect(() => {
    // Fetch when:
    // 1. No data loaded yet
    // 2. Not currently loading
    // 3. totalCount is defined (not undefined) - wait for totalCount to load first
    // 4. totalCount >= 0 (fetch if 0 or greater - always fetch initial data when totalCount is known)
    // 
    // Important: Don't fetch if totalCount is undefined - wait for it to load first
    // When totalCount === 0, we fetch once to confirm empty state, then TableComponent will show "no results"
    const shouldFetch = 
      allData.length === 0 && 
      !loading && 
      totalCount !== undefined &&
      totalCount >= 0;
    
    if (shouldFetch) {
      fetchData(0, initialFetchSize).catch(() => {
        // Errors are already handled and logged inside fetchData
      });
    }
  }, [allData.length, totalCount, initialFetchSize, loading, fetchData]);

  /**
   * Handles page navigation and triggers incremental data loading if needed
   * 
   * Updates the current page and checks if additional data needs to be fetched
   * to display the requested page. Calculates the appropriate offset for fetching
   * based on the fetchSize, ensuring efficient data loading.
   * 
   * @param page - Target page number (1-based)
   */
  const handlePageChange = useCallback((page: number): void => {
    setCurrentPage(page);
    
    // Check if we need more data for this page
    if (needsMoreData(page)) {
      const { startIndex } = calculatePageIndices(page, pageSize);
      // Calculate offset aligned to fetchSize boundaries (e.g., 0, 80, 160, ...)
      const offset = Math.floor(startIndex / fetchSize) * fetchSize;
      
      // Only fetch if we haven't loaded data for this offset yet
      if (offset >= allData.length) {
        fetchData(offset, fetchSize).catch(() => {
          // Errors are already handled and logged inside fetchData
        });
      }
    }
  }, [pageSize, fetchSize, needsMoreData, allData.length, fetchData]);

  /**
   * Handles search input changes
   * 
   * Updates the search term state and either delegates to external search handler
   * (if provided) or resets to page 1 for internal filtering.
   * 
   * @param e - Input change event from search input
   */
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (search.onSearch) {
      // External search - delegate to parent component
      search.onSearch(term);
    } else {
      // Internal search - reset to first page when searching
      setCurrentPage(1);
    }
  }, [search]);

  /**
   * Filters data based on custom filter (if provided) and search term
   * 
   * Applies filters in this order:
   * 1. Custom filter (if provided) - filters allData locally
   * 2. Internal search filter (if search is enabled and no external handler)
   * 
   * @returns Filtered data array, or original data if filtering is not applicable
   */
  const filteredData = useMemo(() => {
    let data = allData;
    
    // Apply custom filter first (if provided) - e.g., supervisor filter
    if (customFilter) {
      data = customFilter(data);
    }
    
    // Apply internal search filter if applicable
    if (search.enabled && !search.onSearch && searchTerm.trim()) {
      data = filterTableData(data, columns, searchTerm);
    }
    
    return data;
  }, [allData, customFilter, columns, searchTerm, search]);

  // Calculate total pages based on filtered data if any filtering is active,
  // otherwise use API total count
  const totalPages = useMemo(() => {
    // If custom filter is active (filteredData.length < allData.length) or internal search is active,
    // calculate based on filtered data length
    const hasActiveFilter = customFilter !== undefined || (search.enabled && !search.onSearch && searchTerm.trim());
    if (hasActiveFilter) {
      return Math.max(1, Math.ceil(filteredData.length / pageSize));
    }
    // Otherwise use API total count (use 0 if undefined to show empty state)
    return Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));
  }, [totalCount, pageSize, customFilter, search.enabled, search.onSearch, searchTerm, filteredData.length, allData.length]);

  // Reset currentPage to 1 if it exceeds totalPages when filteredData or totalPages changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredData.length, totalPages, currentPage]);

  /**
   * Calculates the data to display for the current page
   * 
   * For external search mode, returns all filtered data (parent handles pagination).
   * For internal pagination mode, slices the filtered data based on current page.
   * 
   * @returns Array of data items to display on the current page
   */
  const pagedData = useMemo(() => {
    if (search.onSearch) {
      // External search - parent component handles pagination
      return filteredData;
    }
    
    // Internal pagination - slice data for current page
    const { startIndex, endIndex } = calculatePageIndices(currentPage, pageSize);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, search.onSearch]);

  return (
    <div className="flex flex-col w-full bg-(--color-primary-dark)">
      {/* Toolbar */}
      <div className="flex justify-between items-center px-6 pt-10 pb-4">
        <div className="flex items-center gap-2">
          {!leftToolbarActions && !rightToolbarActions && search.enabled && (
            <input
              type="text"
              placeholder={search.placeholder || 'Search...'}
              value={searchTerm}
              onChange={handleSearch}
              className="px-3 py-2 bg-(--color-primary) text-white rounded border-transparent focus:outline-none"
            />
          )}
          {leftToolbarActions}
        </div>
        <div className="flex items-center gap-2">
          {rightToolbarActions}
          {(leftToolbarActions || rightToolbarActions) && search.enabled && (
            <input
              type="text"
              placeholder={search.placeholder || 'Search...'}
              value={searchTerm}
              onChange={handleSearch}
              className="px-3 py-2 bg-(--color-primary) text-white rounded border-transparent focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Table */}
      <TableComponent<T>
        columns={columns}
        data={pagedData}
        loading={externalLoading ?? loading}
        loadingAction={externalLoading ? externalLoadingAction : 'Loading data'}
        selection={selection}
        headerBg={headerBg}
        tablePadding="px-6"
      />

      {/* Pagination */}
      {!search.onSearch && (
        <div className="px-6 pb-4">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount ?? 0}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            disabled={externalLoading ?? loading}
          />
        </div>
      )}
    </div>
  );
}

// Export Column type alias for convenience
export type { IColumn as Column } from './types';

