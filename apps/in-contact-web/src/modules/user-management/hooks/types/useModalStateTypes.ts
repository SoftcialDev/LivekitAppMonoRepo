/**
 * @fileoverview useModalState Hook Types
 * @summary Type definitions for useModalState hook
 */

/**
 * Return type from useModalState hook
 */
export interface UseModalStateReturn {
  /**
   * Whether the modal is currently open
   */
  isModalOpen: boolean;

  /**
   * Opens the modal
   */
  handleOpenModal: () => void;

  /**
   * Closes the modal
   */
  handleCloseModal: () => void;
}

