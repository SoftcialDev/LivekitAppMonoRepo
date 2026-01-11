/**
 * @fileoverview TalkNavigationModal component types
 * @summary Type definitions for TalkNavigationModal component
 * @description Defines props interface for TalkNavigationModal component
 */

/**
 * Props for TalkNavigationModal component
 */
export interface ITalkNavigationModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Handler called when user confirms navigation
   * Should stop all active talk sessions and allow navigation
   */
  onConfirm: () => Promise<void> | void;

  /**
   * Handler called when user cancels navigation
   * Should close modal and keep user on current page
   */
  onCancel: () => void;
}

