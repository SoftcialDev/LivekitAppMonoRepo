/**
 * @fileoverview Supervisor store type definitions
 * @summary Type definitions for supervisor store
 * @description Defines interfaces for supervisor store state and operations
 */

import { UserRole } from '@/modules/auth/enums';
import type { ISupervisorChangeData } from '../../../types/supervisorTypes';

/**
 * Supervisor store state interface
 */
export interface ISupervisorState {
  /**
   * Last supervisor change notification (for triggering re-renders)
   */
  lastSupervisorChange: ISupervisorChangeData | null;

  /**
   * Last supervisor list change notification (for triggering re-renders)
   */
  lastSupervisorListChange: unknown;

  /**
   * Handles supervisor change notification
   * 
   * Determines if the current user should refresh their data and
   * updates the presence store with new supervisor information.
   * 
   * @param data - Supervisor change data
   */
  handleSupervisorChange(data: ISupervisorChangeData): void;

  /**
   * Handles supervisor list changed notification
   * 
   * @param data - Supervisor list change data
   */
  handleSupervisorListChanged(data: unknown): void;

  /**
   * Notifies subscribers of supervisor change
   * 
   * Updates state to trigger re-renders in subscribed components.
   * 
   * @param data - Supervisor change data
   */
  notifySupervisorChange(data: ISupervisorChangeData): void;

  /**
   * Notifies subscribers of supervisor list change
   * 
   * Updates state to trigger re-renders in subscribed components.
   * 
   * @param data - Supervisor list change data
   */
  notifySupervisorListChanged(data: unknown): void;

  /**
   * Determines if the current user should refresh data based on supervisor change
   * 
   * @param data - Supervisor change data
   * @param currentEmail - Current user's email
   * @param currentRole - Current user's role
   * @returns True if user should refresh
   */
  shouldRefreshForUser(
    data: ISupervisorChangeData,
    currentEmail: string,
    currentRole?: UserRole | string | null
  ): boolean;
}

