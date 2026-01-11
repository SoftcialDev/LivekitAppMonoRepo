/**
 * @fileoverview useApiOperation Hook
 * @summary Generic hook for API operations with loading and error handling
 * @description Provides reusable logic for API calls with loading state and error handling
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import type { UseApiOperationReturn } from './types/useApiOperationTypes';

/**
 * Generic hook for API operations with automatic loading state and error handling
 *
 * Wraps an async operation with loading state management and error handling.
 * Automatically shows toast notifications on errors and logs errors for debugging.
 *
 * @template T - Return type of the API operation
 * @param operation - Async function that performs the API operation
 * @param errorMessage - Error message to show in toast notification
 * @param logContext - Optional context object for error logging
 * @returns Hook return value with execute function and loading state
 *
 * @example
 * ```typescript
 * const { execute: fetchUsers, loading } = useApiOperation(
 *   () => getUsersByRole('Admin', 1, 100),
 *   'Failed to load admins',
 *   { role: 'Admin' }
 * );
 *
 * await fetchUsers();
 * ```
 */
export function useApiOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  logContext?: Record<string, unknown>
): UseApiOperationReturn<T> {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await operation();
      return result;
    } catch (error) {
      logError(errorMessage, {
        error,
        ...logContext,
      });
      showToast(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [operation, errorMessage, logContext, showToast]);

  return { execute, loading };
}

