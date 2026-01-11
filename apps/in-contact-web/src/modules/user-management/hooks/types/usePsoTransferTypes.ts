/**
 * @fileoverview usePsoTransfer Hook Types
 * @summary Type definitions for usePsoTransfer hook
 */

/**
 * Transfer state for confirmation modal
 */
export interface PendingTransfer {
  /**
   * Supervisor email to transfer to
   */
  supervisorEmail: string;
  
  /**
   * Supervisor name for display
   */
  supervisorName: string;
  
  /**
   * Number of PSOs being transferred
   */
  psoCount: number;
}

/**
 * Return type for usePsoTransfer hook
 */
export interface UsePsoTransferReturn {
  /**
   * Currently selected supervisor email for transfer (single select, last value)
   */
  transferToEmail: string | null;
  
  /**
   * Updates the transfer target (keeps only last selected value)
   */
  setTransferToEmail: (email: string | null) => void;
  
  /**
   * Pending transfer state for confirmation modal
   */
  pendingTransfer: PendingTransfer | null;
  
  /**
   * Whether transfer is in progress
   */
  transferring: boolean;
  
  /**
   * Opens transfer confirmation modal
   */
  openTransferModal: (supervisorEmail: string, supervisorName: string, selectedEmails: string[]) => void;
  
  /**
   * Closes transfer confirmation modal
   */
  closeTransferModal: () => void;
  
  /**
   * Executes the transfer operation
   */
  executeTransfer: (selectedEmails: string[], onSuccess?: () => Promise<void>) => Promise<void>;
}

