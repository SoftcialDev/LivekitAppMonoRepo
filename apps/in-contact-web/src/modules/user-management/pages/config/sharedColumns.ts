/**
 * @fileoverview Shared column definitions for user management pages
 * @summary Common column configurations reused across user management pages
 * @description Provides base column definitions and helper functions to build column configurations
 */

import type { Column } from '@/ui-kit/tables';
import type { BaseUserManagementItem, CandidateUser } from '../../types';

/**
 * Base columns used in candidate tables (add modal)
 * Same for all user management pages
 */
export const BASE_CANDIDATE_COLUMNS: Column<CandidateUser>[] = [
  { key: 'email', header: 'Email' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'role', header: 'Role' },
];

/**
 * Base columns for main tables (email, firstName, lastName, role)
 * Used as foundation for most user management pages
 */
export const BASE_MAIN_COLUMNS: Column<BaseUserManagementItem>[] = [
  { key: 'email', header: 'Email' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'role', header: 'Role' },
];

/**
 * Base columns without role (email, firstName, lastName)
 * Used when additional columns need to be inserted before role
 */
export const BASE_MAIN_COLUMNS_WITHOUT_ROLE: Column<BaseUserManagementItem>[] = [
  { key: 'email', header: 'Email' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
];

/**
 * Role column definition
 */
export const ROLE_COLUMN: Column<BaseUserManagementItem> = {
  key: 'role',
  header: 'Role',
};

/**
 * Supervisor column definition for PSO pages
 */
export const SUPERVISOR_COLUMN: Column<BaseUserManagementItem> = {
  key: 'supervisorName',
  header: 'Supervisor',
};

