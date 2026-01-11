/**
 * @fileoverview Supervisor page configuration
 * @summary Configuration for Supervisor user management page
 * @description Defines API functions, UI labels, and columns for Supervisor page with Transfer PSOs feature
 */

import type { Column } from '@/ui-kit/tables';
import { createRoleBasedClient } from '../../api/utils';
import type {
  UserByRole,
  UserManagementConfig,
  BaseUserManagementItem,
  CandidateUser,
} from '../../types';

/**
 * Supervisor item type (same as UserByRole)
 */
export type SupervisorItem = UserByRole & BaseUserManagementItem;

/**
 * Creates the configuration for Supervisor page
 *
 * @returns UserManagementConfig for Supervisor page
 */
export function createSupervisorPageConfig(): UserManagementConfig<SupervisorItem> {
  return {
    api: createRoleBasedClient<SupervisorItem>({
      mainRole: 'Supervisor',
      candidateRoles: 'PSO,Unassigned',
      newRole: 'Supervisor',
      deleteReason: 'Supervisor role removed',
    }),
    ui: {
      title: 'Supervisors',
      addButtonLabel: 'Add Supervisor',
      modalTitle: 'Add Supervisor',
      confirmLabel: 'Add Supervisor',
      loadingAction: 'Loading supervisors',
      candidatesLoadingAction: 'Loading candidates',
      addSuccessMessage: '{count} supervisor(s) added',
      removeSuccessMessage: 'Removed {email}',
      fetchErrorMessage: 'Could not load supervisors',
      addErrorMessage: 'Failed to add supervisors',
      removeErrorMessage: 'Failed to remove supervisor',
    },
    columns: {
      mainColumns: [
        { key: 'email', header: 'Email' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'role', header: 'Role' },
      ] as Column<SupervisorItem>[],
      candidateColumns: [
        { key: 'email', header: 'Email' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'role', header: 'Role' },
      ] as Column<CandidateUser>[],
    },
    features: {
      transferButton: true, // Enable Transfer PSOs button per row
    },
  };
}

