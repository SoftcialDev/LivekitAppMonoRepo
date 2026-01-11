/**
 * @fileoverview useUserManagementOperations Hook
 * @summary Hook for user management operations (add, remove)
 * @description Provides handlers for adding and removing user management items
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import type {
  BaseUserManagementItem,
  UserManagementConfig,
} from '../types';
import type { UseUserManagementOperationsReturn } from './types/useUserManagementOperationsTypes';

/**
 * Hook for user management operations (add, remove)
 *
 * Provides handlers for adding and removing items with validation,
 * error handling, and success notifications.
 *
 * @template T - Type of items being managed (must extend BaseUserManagementItem)
 * @param config - Configuration object with API functions and UI labels
 * @param totalCount - Current total count of items (for validation)
 * @param onRefresh - Callback to refresh data after operations
 * @returns Hook return value with operation handlers
 */
export function useUserManagementOperations<T extends BaseUserManagementItem>(
  config: UserManagementConfig<T>,
  totalCount: number | undefined,
  onRefresh: () => Promise<void>
): UseUserManagementOperationsReturn<T> {
  const { account } = useAuth();
  const { showToast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);
  const currentEmailRef = useRef<string>(account?.username?.toLowerCase() ?? '');

  useEffect(() => {
    currentEmailRef.current = account?.username?.toLowerCase() ?? '';
  }, [account]);

  const handleConfirmAdd = useCallback(
    async (selectedEmails: string[]): Promise<void> => {
      if (selectedEmails.length === 0) {
        showToast('Please select at least one user', 'warning');
        return;
      }

      try {
        await config.api.addItems(selectedEmails);
        const successMessage = config.ui.addSuccessMessage.replace(
          '{count}',
          selectedEmails.length.toString()
        );
        showToast(successMessage, 'success');
        await onRefresh();
      } catch (error) {
        logError('Failed to add user management items', {
          error,
          emails: selectedEmails,
          title: config.ui.title,
        });
        showToast(config.ui.addErrorMessage, 'error');
      }
    },
    [config.api, config.ui, showToast, onRefresh]
  );

  const handleRemove = useCallback(
    async (item: T): Promise<void> => {
      const currentEmail = currentEmailRef.current;
      const itemEmail = item.email?.toLowerCase() ?? '';

      if (itemEmail === currentEmail) {
        showToast("You can't remove yourself", 'warning');
        return;
      }

      const minItems = config.features?.minItemsForDeletion ?? 0;
      // If totalCount is undefined, allow removal (will be checked by backend)
      // If totalCount is defined, check against minItems
      if (totalCount !== undefined && totalCount <= minItems) {
        showToast(
          `Cannot remove. Minimum of ${minItems + 1} items required.`,
          'warning'
        );
        return;
      }

      setIsRemoving(true);
      try {
        await config.api.removeItem(item);
        const successMessage = config.ui.removeSuccessMessage.replace(
          '{email}',
          item.email
        );
        showToast(successMessage, 'success');
        // Don't call onRefresh here - refreshKey will be incremented in wrapper to force DataTable remount
      } catch (error) {
        logError('Failed to remove user management item', {
          error,
          item,
          title: config.ui.title,
        });
        showToast(config.ui.removeErrorMessage, 'error');
      } finally {
        setIsRemoving(false);
      }
    },
    [totalCount, config.api, config.ui, config.features, showToast]
  );

  return {
    handleConfirmAdd,
    handleRemove,
    isRemoving,
  };
}

