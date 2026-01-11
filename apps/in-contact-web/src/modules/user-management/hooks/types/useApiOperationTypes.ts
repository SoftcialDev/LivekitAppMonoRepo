/**
 * @fileoverview useApiOperation Hook Types
 * @summary Type definitions for useApiOperation hook
 */

/**
 * Hook return type for useApiOperation
 */
export interface UseApiOperationReturn<T> {
  /**
   * Executes the API operation
   *
   * @returns Promise resolving to operation result or null if error occurs
   */
  execute: () => Promise<T | null>;

  /**
   * Whether the operation is currently in progress
   */
  loading: boolean;
}

