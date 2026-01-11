/**
 * @fileoverview useUserManagementOperations Hook Types
 * @summary Type definitions for useUserManagementOperations hook
 */

import type { BaseUserManagementItem } from '../../types';

/**
 * Return type from useUserManagementOperations hook
 */
export interface UseUserManagementOperationsReturn<T extends BaseUserManagementItem> {
  /**
   * Adds selected candidates
   * @param selectedEmails - Array of selected candidate emails
   */
  handleConfirmAdd: (selectedEmails: string[]) => Promise<void>;

  /**
   * Removes an item
   * @param item - Item to remove
   */
  handleRemove: (item: T) => Promise<void>;

  /**
   * Whether a remove operation is in progress
   */
  isRemoving: boolean;
}

