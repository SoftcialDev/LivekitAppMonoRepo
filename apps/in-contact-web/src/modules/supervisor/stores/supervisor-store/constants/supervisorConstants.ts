/**
 * @fileoverview Supervisor store constants
 * @summary Constants for supervisor store configuration
 * @description Centralized constants for supervisor store operations
 */

import { UserRole } from '@/modules/auth/enums';

/**
 * Roles that should always refresh on supervisor changes
 */
export const ROLES_ALWAYS_REFRESH: readonly UserRole[] = [
  UserRole.Admin,
  UserRole.SuperAdmin,
  UserRole.Supervisor,
];

