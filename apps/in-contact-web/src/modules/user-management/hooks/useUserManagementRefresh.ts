/**
 * @fileoverview useUserManagementRefresh Hook
 * @summary Hook for managing refreshKey state after add/remove operations
 * @description Provides refreshKey state that increments after successful add/remove operations
 */

import { useState, useEffect, useRef } from 'react';
import type { BaseUserManagementItem, UseUserManagementPageReturn } from '../types';

/**
 * Hook for managing refreshKey state after add/remove operations
 *
 * Monitors add/remove operations and increments refreshKey to force DataTable remount
 * when operations complete successfully.
 *
 * @template T - Type of items being managed (must extend BaseUserManagementItem)
 * @param hook - Return value from useUserManagementPage hook
 * @returns refreshKey value to pass to UserManagementPage component
 */
export function useUserManagementRefresh<T extends BaseUserManagementItem>(
  hook: UseUserManagementPageReturn<T>
): number {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const wasRemovingRef = useRef<boolean>(false);

  // Increment refreshKey after delete completes (wait for totalCount to be available)
  useEffect(() => {
    if (wasRemovingRef.current && !hook.isRemoving && hook.totalCount !== undefined) {
      setRefreshKey((prev) => prev + 1);
    }
    wasRemovingRef.current = hook.isRemoving;
  }, [hook.isRemoving, hook.totalCount]);

  return refreshKey;
}

