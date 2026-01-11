/**
 * @fileoverview Types for usePsoSupervisorNotifications hook
 * @summary Type definitions for supervisor notifications hook
 */

/**
 * Options for usePsoSupervisorNotifications hook
 */
export interface IUsePsoSupervisorNotificationsOptions {
  /**
   * PSO email address
   */
  psoEmail: string;

  /**
   * Callback to refetch supervisor information
   */
  refetchSupervisor: () => Promise<void>;
}

