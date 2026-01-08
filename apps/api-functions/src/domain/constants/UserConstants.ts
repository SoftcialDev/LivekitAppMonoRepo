/**
 * @fileoverview UserConstants - Constants related to user domain rules
 * @summary Defines user-related constants and business rules
 * @description Centralizes user-related constants to avoid magic strings and hardcoded business rules
 */

/**
 * User-related constants and business rules
 * @description Contains special user identifiers and role assignment rules
 */
export const UserConstants = {
  /**
   * Special email prefix for SuperAdmin role assignment
   * @description Users with emails starting with this prefix are automatically assigned SuperAdmin role
   * This is a business rule for special administrative access
   */
  SUPER_ADMIN_EMAIL_PREFIX: 'shanty.cerdas'
} as const;

