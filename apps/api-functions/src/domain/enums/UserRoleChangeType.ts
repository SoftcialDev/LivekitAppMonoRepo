/**
 * @fileoverview UserRoleChangeType - Domain enum for user role change operations
 * @description Defines the types of user role change operations
 */

/**
 * Defines the types of user role change operations.
 * @enum {string}
 */
export enum UserRoleChangeType {
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  USER_DELETED = 'USER_DELETED'
}
