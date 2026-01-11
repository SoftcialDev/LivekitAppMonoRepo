/**
 * @fileoverview useNavigationBlocker hook types
 * @summary Type definitions for useNavigationBlocker hook
 * @description Types for blocking React Router navigation during active talk sessions
 */

/**
 * Enhanced navigate function with talk session guard
 */
export interface IEnhancedNavigate {
  (to: string | number, options?: { replace?: boolean; state?: unknown }): void;
  (delta: number): void;
}

/**
 * Return type for useNavigationBlocker hook
 */
export interface IUseNavigationBlockerReturn {
  /**
   * Enhanced navigate function that checks for active talk sessions
   */
  navigate: IEnhancedNavigate;

  /**
   * Whether navigation is currently blocked
   */
  blocked: boolean;

  /**
   * Pending navigation path if blocked
   */
  pendingPath: string | null;

  /**
   * Handle navigation confirmation (stop sessions and navigate)
   */
  handleConfirmNavigation: () => Promise<void>;

  /**
   * Handle navigation cancellation (stay on current page)
   */
  handleCancelNavigation: () => void;
}

