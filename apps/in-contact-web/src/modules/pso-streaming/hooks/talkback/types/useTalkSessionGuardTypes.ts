/**
 * @fileoverview useTalkSessionGuard hook types
 * @summary Type definitions for useTalkSessionGuard hook
 * @description Types for navigation blocking during active talk sessions
 */

/**
 * Options for useTalkSessionGuard hook
 */
export interface IUseTalkSessionGuardOptions {
  /**
   * Whether the guard is enabled
   * 
   * @default true
   */
  enabled?: boolean;
}

/**
 * Return type for useTalkSessionGuard hook
 */
export interface IUseTalkSessionGuardReturn {
  /**
   * Whether to show the navigation confirmation modal
   */
  showModal: boolean;

  /**
   * Handle navigation confirmation (user wants to navigate and stop talk)
   */
  handleConfirm: () => Promise<void>;

  /**
   * Handle navigation cancellation (user wants to stay on page)
   */
  handleCancel: () => void;

  /**
   * Get the pending navigation path
   */
  getPendingNavigation: () => string | null;

  /**
   * Check if navigation should be blocked and show modal if needed
   * 
   * @param targetPath - Target path to navigate to
   * @returns true if navigation should be blocked
   */
  checkAndBlockNavigation: (targetPath: string) => boolean;
}

