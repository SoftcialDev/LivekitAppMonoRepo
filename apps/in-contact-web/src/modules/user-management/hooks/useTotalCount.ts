/**
 * @fileoverview useTotalCount Hook
 * @summary Hook for fetching and managing total count
 * @description Provides state and handler for fetching total count from API
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import type { BaseUserManagementItem, UserManagementConfig } from '../types';

/**
 * Hook for fetching and managing total count
 *
 * Provides state and handler for fetching total count from API.
 * Automatically fetches on mount when auth is initialized.
 *
 * @template T - Type of items being managed (must extend BaseUserManagementItem)
 * @param config - Configuration object with API functions
 * @returns Hook return value with totalCount state and fetch handler
 *
 * @example
 * ```typescript
 * const { totalCount, fetchTotalCount } = useTotalCount(config);
 * ```
 */

export function useTotalCount<T extends BaseUserManagementItem>(
  config: UserManagementConfig<T>
): { totalCount: number | undefined; fetchTotalCount: () => Promise<void> } {
  const { account, initialized } = useAuth();
  const { showToast } = useToast();
  const hasInitializedRef = useRef<boolean>(false);
  // Initialize with undefined to differentiate between "not loaded" and "actually 0"
  // undefined = not loaded yet (show loading)
  // 0 = loaded and there are no users (show "no users")
  // > 0 = loaded and there are users (fetch and display)
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const isLoadingRef = useRef<boolean>(false);

  const fetchTotalCount = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current) return; // Prevent concurrent calls
    isLoadingRef.current = true;
    try {
      const count = await config.api.fetchTotalCount();
      setTotalCount(count);
    } catch (error) {
      logError('Failed to fetch user management total count', {
        error,
        title: config.ui.title,
      });
      showToast(config.ui.fetchErrorMessage, 'error');
    } finally {
      isLoadingRef.current = false;
    }
  }, [config.api, config.ui, showToast]);

  // Load total count on mount when auth is initialized (only once)
  useEffect(() => {
    if (!initialized || !account || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    fetchTotalCount().catch(() => {
      // Error already handled in fetchTotalCount
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, account]); // Only depend on initialized and account, not fetchTotalCount

  return {
    totalCount,
    fetchTotalCount,
  };
}

