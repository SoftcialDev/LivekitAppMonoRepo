/**
 * @fileoverview PSO Dashboard types
 * @summary Type definitions for PSO Dashboard module
 * @description Type definitions for supervisor information and dashboard data
 */

/**
 * Supervisor information
 */
export interface ISupervisor {
  id: string;
  azureAdObjectId: string;
  email: string;
  fullName: string;
}

/**
 * Response from GetSupervisorForPso API
 */
export type GetSupervisorForPsoResponse =
  | { supervisor: ISupervisor }
  | { message: string }
  | { error: string };

