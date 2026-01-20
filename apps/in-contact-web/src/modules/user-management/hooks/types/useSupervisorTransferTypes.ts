/**
 * @fileoverview useSupervisorTransfer Hook Types
 * @summary Type definitions for useSupervisorTransfer hook
 */

/**
 * Transfer state for confirmation modal
 * 
 * Stores information about a pending transfer operation for display in confirmation modal.
 */
export interface PendingSupervisorTransfer {
  /**
   * Email of the supervisor who will receive the PSOs
   */
  supervisorEmail: string;
  
  /**
   * Display name of the supervisor who will receive the PSOs
   */
  supervisorName: string;
}

/**
 * Return type for useSupervisorTransfer hook
 * 
 * Provides state and functions for transferring all PSOs from the current supervisor
 * to another supervisor using the transferPsos API endpoint.
 */
export interface UseSupervisorTransferReturn {
  /**
   * Pending transfer state for confirmation modal
   * 
   * Contains supervisor information when a transfer is pending confirmation.
   * Will be null when no transfer is pending.
   */
  pendingTransfer: PendingSupervisorTransfer | null;
  
  /**
   * Whether a transfer operation is currently in progress
   */
  transferring: boolean;
  
  /**
   * Opens the transfer confirmation modal
   * 
   * Sets up the pending transfer state with the target supervisor information
   * and opens the modal for user confirmation.
   * 
   * @param supervisorEmail - Email of the supervisor to transfer PSOs to
   * @param supervisorName - Display name of the supervisor to transfer PSOs to
   */
  openTransferModal: (supervisorEmail: string, supervisorName: string) => void;
  
  /**
   * Closes the transfer confirmation modal and resets transfer state
   * 
   * Clears the pending transfer and closes the modal.
   * Does not execute the transfer if called before confirmation.
   */
  closeTransferModal: () => void;
  
  /**
   * Executes the transfer operation
   * 
   * Transfers ALL PSOs currently assigned to the logged-in supervisor
   * to the target supervisor specified in pendingTransfer.
   * 
   * Uses the transferPsos API endpoint which requires the caller to be a Supervisor.
   * Shows success/error toast notifications based on the operation result.
   * 
   * @param onSuccess - Optional callback to execute after successful transfer
   * @returns Promise that resolves when the transfer operation completes
   * 
   * @throws Will show error toast if transfer fails (does not throw to caller)
   */
  executeTransfer: (onSuccess?: () => Promise<void>) => Promise<void>;
}

