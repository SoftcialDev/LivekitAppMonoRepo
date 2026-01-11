/**
 * @fileoverview usePsoTransfer hook
 * @summary Hook for transferring PSOs to a supervisor
 * @description Manages transfer state and provides transfer functionality
 * Reuses useModalState for modal state management
 */

import { useState, useCallback } from 'react';
import { changeSupervisor } from '../api/supervisorClient';
import { useToast } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import { useModalState } from './useModalState';
import type { UsePsoTransferReturn, PendingTransfer } from './types/usePsoTransferTypes';

/**
 * Hook for transferring PSOs to a supervisor
 * 
 * Manages transfer state and provides functions to initiate and execute transfers.
 * Shows confirmation modal before executing.
 * Reuses useModalState for basic modal open/close functionality.
 * 
 * @returns Object with transfer state and functions
 */
export function usePsoTransfer(): UsePsoTransferReturn {
  const { showToast } = useToast();
  const { isModalOpen, handleOpenModal, handleCloseModal } = useModalState();
  const [transferToEmail, setTransferToEmail] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [transferring, setTransferring] = useState(false);

  /**
   * Opens transfer confirmation modal
   */
  const openTransferModal = useCallback(
    (supervisorEmail: string, supervisorName: string, selectedEmails: string[]): void => {
      setPendingTransfer({
        supervisorEmail,
        supervisorName,
        psoCount: selectedEmails.length,
      });
      handleOpenModal();
    },
    [handleOpenModal]
  );

  /**
   * Closes transfer confirmation modal and resets transfer state
   */
  const closeTransferModal = useCallback((): void => {
    handleCloseModal();
    setPendingTransfer(null);
    setTransferToEmail(null);
  }, [handleCloseModal]);

  /**
   * Executes the transfer operation
   */
  const executeTransfer = useCallback(
    async (selectedEmails: string[], onSuccess?: () => Promise<void>): Promise<void> => {
      if (!pendingTransfer) return;

      setTransferring(true);
      try {
        const updatedCount = await changeSupervisor({
          userEmails: selectedEmails,
          newSupervisorEmail: pendingTransfer.supervisorEmail,
        });
        showToast(
          `Transferred ${updatedCount} PSO(s) to ${pendingTransfer.supervisorName}`,
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
    transferToEmail,
    setTransferToEmail,
    pendingTransfer, // Will be null when modal is closed (cleared in closeTransferModal)
    transferring,
    openTransferModal,
    closeTransferModal,
    executeTransfer,
  };
}
