/**
 * @fileoverview useSupervisorTransfer Hook
 * @summary Hook for transferring all PSOs from current supervisor to another supervisor
 * @description Manages transfer state and provides transfer functionality using transferPsos API.
 * Reuses useModalState for modal state management.
 */

import { useState, useCallback } from 'react';
import { transferPsos } from '../api/supervisorClient';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import { useModalState } from './useModalState';
import type { UseSupervisorTransferReturn, PendingSupervisorTransfer } from './types/useSupervisorTransferTypes';

/**
 * Hook for transferring all PSOs from current supervisor to another supervisor
 *
 * Manages transfer state and provides functions to initiate and execute transfers.
 * Shows confirmation modal before executing. Transfers ALL PSOs of the current supervisor
 * (the logged-in user who must be a Supervisor) to the target supervisor specified.
 *
 * Uses the transferPsos API endpoint which requires the caller to be a Supervisor role.
 * The API transfers all PSOs assigned to the caller, not a subset.
 *
 * Reuses useModalState for basic modal open/close functionality.
 *
 * @returns Hook return value with transfer state and functions

 * ```
 */
export function useSupervisorTransfer(): UseSupervisorTransferReturn {
  const { showToast } = useToast();
  const { handleOpenModal, handleCloseModal } = useModalState();
  const [pendingTransfer, setPendingTransfer] = useState<PendingSupervisorTransfer | null>(null);
  const [transferring, setTransferring] = useState(false);

  /**
   * Opens the transfer confirmation modal
   *
   * Sets up the pending transfer state with the target supervisor information
   * and opens the modal for user confirmation.
   *
   * @param supervisorEmail - Email of the supervisor to transfer PSOs to
   * @param supervisorName - Display name of the supervisor to transfer PSOs to
   */
  const openTransferModal = useCallback(
    (supervisorEmail: string, supervisorName: string): void => {
      setPendingTransfer({
        supervisorEmail,
        supervisorName,
      });
      handleOpenModal();
    },
    [handleOpenModal]
  );

  /**
   * Closes the transfer confirmation modal and resets transfer state
   *
   * Clears the pending transfer and closes the modal.
   * Does not execute the transfer if called before confirmation.
   */
  const closeTransferModal = useCallback((): void => {
    handleCloseModal();
    setPendingTransfer(null);
  }, [handleCloseModal]);

  /**
   * Executes the transfer operation
   *
   * Transfers ALL PSOs currently assigned to the logged-in supervisor
   * to the target supervisor specified in pendingTransfer.
   *
   * Uses the transferPsos API endpoint which requires the caller to be a Supervisor.
   * Shows success/error toast notifications based on the operation result.
   *
   * @param onSuccess - Optional callback to execute after successful transfer (e.g., refresh data)
   * @returns Promise that resolves when the transfer operation completes
   *
   * @throws Will show error toast if transfer fails (does not throw to caller)
   */
  const executeTransfer = useCallback(
    async (onSuccess?: () => Promise<void>): Promise<void> => {
      if (!pendingTransfer) return;

      setTransferring(true);
      try {
        const transferredCount = await transferPsos(pendingTransfer.supervisorEmail);
        showToast(
          `Transferred ${transferredCount} PSO(s) to ${pendingTransfer.supervisorName}`,
          'success'
        );
        closeTransferModal();
        if (onSuccess) {
          await onSuccess();
        }
      } catch (error) {
        logError('Failed to transfer PSOs', { error, pendingTransfer });
        showToast('Transfer failed', 'error');
      } finally {
        setTransferring(false);
      }
    },
    [pendingTransfer, showToast, closeTransferModal]
  );

  return {
    pendingTransfer,
    transferring,
    openTransferModal,
    closeTransferModal,
    executeTransfer,
  };
}

