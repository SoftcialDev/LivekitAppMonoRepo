/**
 * @fileoverview Manager Status enumerations
 * @summary Enumerations for Contact Manager availability status
 * @description Defines enumerations for Contact Manager availability and status states
 * 
 * These statuses are used to indicate the current availability state of a Contact Manager
 * and affect how they appear in the presence/status system. This enum is shared across
 * multiple modules (presence, sidebar, contact-manager, etc.).
 */

/**
 * Contact Manager availability status
 * 
 * Represents the different availability states a Contact Manager can have.
 * Used to determine visual indicators and availability for PSOs.
 */
export enum ManagerStatus {
  /**
   * Contact Manager is unavailable
   */
  Unavailable = 'Unavailable',

  /**
   * Contact Manager is available
   */
  Available = 'Available',

  /**
   * Contact Manager is on break
   */
  OnBreak = 'OnBreak',

  /**
   * Contact Manager is on another task
   */
  OnAnotherTask = 'OnAnotherTask',
}

