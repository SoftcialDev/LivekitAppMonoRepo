/**
 * @fileoverview PSO page configuration
 * @summary Configuration for PSO user management page
 * @description Defines API calls, UI labels, columns, and features for the PSO page
 */

import type { Column } from '@/ui-kit/tables';
import { createRoleBasedClient } from '../../api/utils';
import type {
  UserManagementConfig,
  CandidateUser,
  PsoItem,
} from '../../types';

/**
 * Creates configuration for the PSO page
 * 
 * Uses createRoleBasedClient for standard role management operations.
 * Adds supervisor filter and batch transfer features via features config.
 * 
 * @returns UserManagementConfig for PSO page
 */
export function createPsoPageConfig(): UserManagementConfig<PsoItem> {
  return {
    api: createRoleBasedClient<PsoItem>({
      mainRole: 'PSO',
      candidateRoles: 'Unassigned',
      newRole: 'PSO',
      deleteReason: 'PSO role removed',
    }),
    ui: {
      title: 'PSOs',
      addButtonLabel: 'Add PSO',
      modalTitle: 'Add PSOs',
      confirmLabel: 'Add Selected',
      loadingAction: 'Loading PSOs',
      candidatesLoadingAction: 'Loading candidates',
      addSuccessMessage: '{count} user(s) added',
      removeSuccessMessage: 'Removed {email}',
      fetchErrorMessage: 'Failed to load PSOs',
      addErrorMessage: 'Failed to add PSOs',
      removeErrorMessage: 'Failed to remove PSO',
    },
    columns: {
      mainColumns: [
        { key: 'email', header: 'Email' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'supervisorName', header: 'Supervisor' },
        { key: 'role', header: 'Role' },
      ] as Column<PsoItem>[],
      candidateColumns: [
        { key: 'email', header: 'Email' },
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'role', header: 'Role' },
      ] as Column<CandidateUser>[],
    },
    features: {
      showRowCheckboxes: true,
      supervisorFilter: true,
      batchTransfer: true,
    },
  };
}

