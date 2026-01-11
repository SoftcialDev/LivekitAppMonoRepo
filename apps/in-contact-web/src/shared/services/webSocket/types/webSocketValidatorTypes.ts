/**
 * @fileoverview WebSocket validator type definitions
 */

/**
 * Connection validation result
 */
export interface IConnectionValidationResult {
  /**
   * Whether connection should be reused
   */
  shouldReuse: boolean;

  /**
   * Whether user should be switched
   */
  shouldSwitch: boolean;

  /**
   * Whether connection is in progress
   */
  isInProgress: boolean;
}

