/**
 * @fileoverview Presence enumerations
 * @summary Enumerations for presence module
 * @description Defines enumerations for user presence status
 */

/**
 * User presence status values
 * 
 * Centralized enum for presence status values used across the application.
 * Use this enum instead of string literals to ensure type safety and consistency.
 */
export enum PresenceStatus {
  /**
   * User is currently online
   */
  Online = 'online',

  /**
   * User is currently offline
   */
  Offline = 'offline',
}

