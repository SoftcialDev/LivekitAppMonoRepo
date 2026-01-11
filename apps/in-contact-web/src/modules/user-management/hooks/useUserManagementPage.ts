/**
 * @fileoverview useUserManagementPage hook factory
 * @summary Generic hook factory for user management pages
 * @description Provides reusable logic for Admin, SuperAdmin, Supervisor, PSO, and ContactManager pages
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import { useModalState } from './useModalState';
import { useCandidateSelection } from './useCandidateSelection';
import { useCandidateData } from './useCandidateData';
import { useTotalCount } from './useTotalCount';
import { useUserManagementOperations } from './useUserManagementOperations';
import type {
  BaseUserManagementItem,
  UserManagementConfig,
  UseUserManagementPageReturn,
} from '../types';

/**
 * Generic hook factory for user management pages
 *
 * Provides common state management and handlers for pages that manage users
 * (Admin, SuperAdmin, Supervisor, PSO, ContactManager).
 *
 * @template T - Type of items being managed (must extend BaseUserManagementItem)
 * @param config - Configuration object with API functions, UI labels, and columns
 * @returns Hook return value with state and handlers
 */
export function useUserManagementPage<T extends BaseUserManagementItem>(
  config: UserManagementConfig<T>
): UseUserManagementPageReturn<T> {
  const { showToast } = useToast();
  
  const { totalCount, fetchTotalCount } = useTotalCount(config);
  const filterCurrentUser = config.ui.title === 'Contact Managers';
  const { candidates, candidatesLoading, fetchCandidates } = useCandidateData(
    config,
    filterCurrentUser
  );
  const { isModalOpen, handleOpenModal, handleCloseModal } = useModalState();
  const { selectedEmails, setSelectedEmails, clearSelection } = useCandidateSelection();

  const onRefresh = useCallback(async (): Promise<void> => {
    await Promise.all([fetchTotalCount(), fetchCandidates()]);
  }, [fetchTotalCount, fetchCandidates]);

  const { handleConfirmAdd: handleConfirmAddBase, handleRemove: handleRemoveBase, isRemoving } =
    useUserManagementOperations(config, totalCount, onRefresh);
  
  // Wrap handleRemove to increment refreshKey and set loading after delete completes
  const handleRemove = useCallback(async (item: Parameters<typeof handleRemoveBase>[0]): Promise<void> => {
    await handleRemoveBase(item);
    // Reset loading state and increment refreshKey after delete completes to force DataTable remount
    hasCompletedInitialLoadRef.current = false;
    isFetchingRef.current = false;
    setItemsLoading(true);
    setRefreshKey((prev) => prev + 1);
  }, [handleRemoveBase]);

  // Initialize itemsLoading to true if totalCount is undefined (not loaded yet)
  // This ensures loading is shown while waiting for totalCount to load
  const [itemsLoading, setItemsLoading] = useState<boolean>(totalCount === undefined);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const hasCompletedInitialLoadRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  
  // Update itemsLoading when totalCount changes
  // Show loading while totalCount is undefined (waiting for API response)
  useEffect(() => {
    if (totalCount === undefined) {
      // Reset loading state when totalCount becomes undefined (e.g., after refresh)
      if (hasCompletedInitialLoadRef.current) {
        hasCompletedInitialLoadRef.current = false;
      }
      setItemsLoading(true);
    }
  }, [totalCount]);
  
  const onFetch = useCallback(
    async (limit: number, offset: number): Promise<T[]> => {
      if (isFetchingRef.current) {
        return [];
      }
      isFetchingRef.current = true;
      // Only show loading on initial load (offset === 0) and only if first load hasn't completed
      // This prevents showing loading on subsequent fetches (incremental pagination)
      if (offset === 0 && !hasCompletedInitialLoadRef.current) {
        setItemsLoading(true);
      }
      try {
        const items = await config.api.onFetch(limit, offset);
        // Mark initial load as completed after first successful fetch
        if (offset === 0) {
          hasCompletedInitialLoadRef.current = true;
          setItemsLoading(false); // Clear loading after first fetch completes
        }
        return items.map((item) => ({
          ...item,
          id: item.id || item.azureAdObjectId || item.email,
        }));
      } catch (error) {
        logError('Failed to fetch user management items', {
          error,
          title: config.ui.title,
          limit,
          offset,
        });
        showToast(config.ui.fetchErrorMessage, 'error');
        // Mark initial load as completed even on error to prevent infinite loading
        if (offset === 0) {
          hasCompletedInitialLoadRef.current = true;
          setItemsLoading(false);
        }
        return [];
      } finally {
        // Only clear loading flag if it was set (initial load)
        // For incremental fetches, keep previous loading state
        if (offset === 0 && hasCompletedInitialLoadRef.current) {
          // Already cleared in try/catch blocks
        }
        isFetchingRef.current = false;
      }
    },
    [config.api, config.ui, showToast]
  );

  const handleOpenModalWithFetch = useCallback((): void => {
    clearSelection();
    handleOpenModal();
    fetchCandidates().catch(() => {});
  }, [clearSelection, handleOpenModal, fetchCandidates]);

  const handleCloseModalWithClear = useCallback((): void => {
    handleCloseModal();
    clearSelection();
  }, [handleCloseModal, clearSelection]);

  const handleConfirmAdd = useCallback(async (): Promise<void> => {
    await handleConfirmAddBase(selectedEmails);
    handleCloseModal();
    clearSelection();
    // Force refresh after add completes - reset loading state and increment refreshKey
    hasCompletedInitialLoadRef.current = false;
    isFetchingRef.current = false;
    setItemsLoading(true);
    await fetchTotalCount();
    setRefreshKey((prev) => prev + 1);
  }, [handleConfirmAddBase, selectedEmails, handleCloseModal, clearSelection, fetchTotalCount]);

  /**
   * Refreshes the total count and forces data refetch
   */
  const refreshItems = useCallback(async (): Promise<void> => {
    // Reset flags before fetching to ensure clean state
    hasCompletedInitialLoadRef.current = false;
    isFetchingRef.current = false;
    setItemsLoading(true); // Show loading while refreshing
    await fetchTotalCount();
    // itemsLoading will be cleared when onFetch completes
  }, [fetchTotalCount]);

  return {
    totalCount,
    onFetch,
    itemsLoading,
    candidates,
    candidatesLoading,
    isModalOpen,
    selectedEmails,
    handleOpenModal: handleOpenModalWithFetch,
    handleCloseModal: handleCloseModalWithClear,
    handleConfirmAdd,
    handleRemove,
    isRemoving,
    setSelectedEmails,
    refreshItems,
    refreshKey,
  };
}

