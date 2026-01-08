/**
 * @fileoverview WebPubSubGroups - Constants for WebPubSub group names
 * @summary Defines all WebPubSub group names used in the application
 * @description Centralizes WebPubSub group names to avoid magic strings throughout the codebase
 */

/**
 * WebPubSub group names used in the application
 * @description All users are added to the presence group for online/offline status tracking.
 * PSOs get additional groups for commands and status updates.
 */
export const WebPubSubGroups = {
  /**
   * Presence group for all users
   * @description Used for broadcasting online/offline status updates to all connected users
   */
  PRESENCE: 'presence',

  /**
   * Contact Manager status updates group
   * @description Used for broadcasting status updates from Contact Managers to PSOs
   */
  CM_STATUS_UPDATES: 'cm-status-updates'
} as const;

