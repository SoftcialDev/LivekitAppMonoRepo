/**
 * @fileoverview Error Handling Types
 * @summary Type definitions for error handling utilities
 * @description Defines interfaces for error handling functions used in streaming dashboard
 */

/**
 * Options for handling permission errors
 */
export interface HandlePermissionErrorOptions {
  /**
   * User Azure AD Object ID
   */
  userAdId?: string;

  /**
   * User email address
   */
  userEmail?: string;

  /**
   * Error that occurred
   */
  error: unknown;
}

/**
 * Options for handling LiveKit connection errors
 */
export interface HandleConnectionErrorOptions {
  /**
   * User Azure AD Object ID
   */
  userAdId?: string;

  /**
   * User email address
   */
  userEmail?: string;

  /**
   * User role - only PSOs should report LiveKit connection failures
   */
  userRole?: string;

  /**
   * Error that occurred
   */
  error: unknown;

  /**
   * Room name (optional)
   */
  roomName?: string;

  /**
   * LiveKit server URL (optional)
   */
  livekitUrl?: string;
}

/**
 * Options for handling track creation errors
 */
export interface HandleTrackCreationErrorOptions {
  /**
   * User Azure AD Object ID
   */
  userAdId?: string;

  /**
   * User email address
   */
  userEmail?: string;

  /**
   * Error that occurred
   */
  error: unknown;
}

