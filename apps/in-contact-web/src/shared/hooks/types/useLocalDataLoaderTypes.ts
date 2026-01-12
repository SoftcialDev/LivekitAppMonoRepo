/**
 * @fileoverview useLocalDataLoader Hook Types
 * @summary Type definitions for useLocalDataLoader hook
 * @description Type definitions for the useLocalDataLoader hook parameters and return values
 */

/**
 * Options for useLocalDataLoader hook
 * 
 * @template T Type of each data item in the array
 */
export interface IUseLocalDataLoaderOptions<T> {
  /**
   * Array of data items to paginate
   */
  data: T[];
  /**
   * Initial fetch size for DataTable
   * @default 200
   */
  initialFetchSize?: number;
  /**
   * Fetch size for incremental loading
   * @default 200
   */
  fetchSize?: number;
}

/**
 * Return type for useLocalDataLoader hook
 */
export interface IUseLocalDataLoaderReturn {
  /**
   * Data loader configuration for DataTable
   */
  dataLoader: {
    /**
     * Total count of items in the data array
     */
    totalCount: number;
    /**
     * Function to fetch paginated data
     * 
     * @param limit - Number of items to fetch
     * @param offset - Starting offset (0-based)
     * @returns Promise resolving to paginated data result
     */
    onFetch: (limit: number, offset: number) => Promise<{
      /**
       * Array of paginated data items
       */
      data: unknown[];
      /**
       * Total number of items in the full dataset
       */
      total: number;
      /**
       * Number of items in the current page
       */
      count: number;
    }>;
    /**
     * Initial fetch size for DataTable
     */
    initialFetchSize: number;
    /**
     * Fetch size for incremental loading
     */
    fetchSize: number;
  };
}

