/**
 * @fileoverview useLocalDataLoader hook
 * @summary Hook for creating data loaders with local pagination
 * @description Provides a reusable hook for creating DataTable data loaders that paginate local data arrays
 */

import { useCallback, useMemo } from 'react';
import type {
  IUseLocalDataLoaderOptions,
  IUseLocalDataLoaderReturn,
} from './types/useLocalDataLoaderTypes';

/**
 * Creates a data loader for DataTable that paginates a local data array
 *
 * This hook provides a reusable pattern for creating DataTable data loaders when
 * all data is already loaded in memory and needs to be paginated client-side.
 * It handles slicing the data array based on limit and offset parameters.
 *
 * @template T Type of each data item in the array
 * @param options - Configuration options for the data loader
 * @param options.data - Array of data items to paginate
 * @param options.initialFetchSize - Initial fetch size for DataTable (default: 200)
 * @param options.fetchSize - Fetch size for incremental loading (default: 200)
 * @returns Data loader configuration object with totalCount, onFetch, initialFetchSize, and fetchSize
 *
 * @example
 * ```tsx
 * const { dataLoader } = useLocalDataLoader({
 *   data: reports,
 *   initialFetchSize: 200,
 *   fetchSize: 200,
 * });
 *
 * <DataTable dataLoader={dataLoader} ... />
 * ```
 */
export function useLocalDataLoader<T>(
  options: IUseLocalDataLoaderOptions<T>
): IUseLocalDataLoaderReturn {
  const { data, initialFetchSize = 200, fetchSize = 200 } = options;

  /**
   * Handles data fetching by slicing the data array based on limit and offset
   *
   * @param limit - Number of items to fetch
   * @param offset - Starting offset (0-based)
   * @returns Promise resolving to paginated data result
   */
  const handleDataFetch = useCallback(
    async (limit: number, offset: number) => {
      const paginated = data.slice(offset, offset + limit);
      return {
        data: paginated,
        total: data.length,
        count: paginated.length,
      };
    },
    [data]
  );

  const dataLoader = useMemo(
    () => ({
      totalCount: data.length,
      onFetch: handleDataFetch,
      initialFetchSize,
      fetchSize,
    }),
    [data.length, handleDataFetch, initialFetchSize, fetchSize]
  );

  return { dataLoader };
}

