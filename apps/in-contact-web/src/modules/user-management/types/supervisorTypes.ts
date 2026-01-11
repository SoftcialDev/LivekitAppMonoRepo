/**
 * @fileoverview Supervisor Types
 * @summary Type definitions for Supervisor API requests
 */

/**
 * Request payload for changing supervisor assignment
 */
export interface ChangeSupervisorRequest {
  /**
   * Array of PSO emails to reassign
   */
  userEmails: string[];

  /**
   * New supervisor email, or null to unassign
   */
  newSupervisorEmail: string;
}

