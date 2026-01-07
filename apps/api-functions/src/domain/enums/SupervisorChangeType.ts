/**
 * @fileoverview SupervisorChangeType - Domain enum for supervisor change operations
 * @description Defines the types of supervisor change operations
 */

/**
 * Defines the types of supervisor change operations.
 * @enum {string}
 */
export enum SupervisorChangeType {
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
  SUPERVISOR_CHANGED = 'SUPERVISOR_CHANGED'
}
