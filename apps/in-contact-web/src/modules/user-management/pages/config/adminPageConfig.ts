/**
 * @fileoverview Admin page configuration
 * @summary Configuration for Admin user management page
 * @description Defines API functions, UI labels, and columns for Admin page
 */

import type { Column } from '@/ui-kit/tables';
import { createRoleBasedClient } from '../../api/utils';
import type {
  UserByRole,
  UserManagementConfig,
  BaseUserManagementItem,
} from '../../types';

/**
 * Admin item type (same as UserByRole)
 */
export type AdminItem = UserByRole & BaseUserManagementItem;

/**
 * Creates the configuration for Admin page
 *
 * @returns UserManagementConfig for Admin page
 */
export function createAdminPageConfig(): UserManagementConfig<AdminItem> {
  return {
    api: createRoleBasedClient<AdminItem>({
      mainRole: 'Admin',
      candidateRoles: 'Supervisor,PSO,Unassigned',
      newRole: 'Admin',
      deleteReason: 'Admin role removed',
    }),
    ui: {
      title: 'Admins',
      addButtonLabel: 'Add Admin',
      modalTitle: 'Add Admin',
      confirmLabel: 'Add Admin',
      loadingAction: 'Loading admins',
      candidatesLoadingAction: 'Loading candidates',
      addSuccessMessage: '{count} admin(s) added',
      removeSuccessMessage: 'Removed {email}',
      fetchErrorMessage: 'Could not load admins',
      addErrorMessage: 'Failed to add admins',
      removeErrorMessage: 'Failed to remove admin',
    },
    columns: {
      mainColumns: [
        { key: 'email', header: 'Email' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'role', header: 'Role' },
      ] as Column<AdminItem>[],
      candidateColumns: [
        { key: 'email', header: 'Email' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'role', header: 'Role' },
      ] as Column<UserByRole>[],
    },
  };
}

