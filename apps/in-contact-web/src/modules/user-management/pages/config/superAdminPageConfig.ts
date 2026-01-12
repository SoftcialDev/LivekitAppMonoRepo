/**
 * @fileoverview Super Admin page configuration
 * @summary Configuration for Super Admin user management page
 * @description Defines API functions, UI labels, and columns for Super Admin page
 */

import {
  getSuperAdmins,
  createSuperAdmin,
  deleteSuperAdmin,
} from '../../api/superAdminClient';
import type {
  SuperAdminDto,
  UserByRole,
  UserManagementConfig,
  BaseUserManagementItem,
} from '../../types';
import {
  mapFullNameToItem,
  createFetchCandidates,
  createCandidateColumns,
  createCommonMainColumns,
} from './sharedConfigUtils';

/**
 * Super Admin item type (extends SuperAdminDto with BaseUserManagementItem)
 */
export type SuperAdminItem = SuperAdminDto & BaseUserManagementItem;

/**
 * Maps SuperAdminDto to SuperAdminItem with firstName/lastName split
 *
 * @param dto - SuperAdminDto from API
 * @returns SuperAdminItem with firstName and lastName
 */
function mapSuperAdminToItem(dto: SuperAdminDto): SuperAdminItem {
  return mapFullNameToItem(dto, {
    id: dto.id,
  });
}

/**
 * Creates the configuration for Super Admin page
 *
 * @returns UserManagementConfig for Super Admin page
 */
export function createSuperAdminPageConfig(): UserManagementConfig<SuperAdminItem> {
  return {
    api: {
      fetchTotalCount: async () => {
        // Fetch all to get totalCount (API returns all items currently)
        const result = await getSuperAdmins();
        return result.totalCount;
      },
      onFetch: async (limit: number, offset: number) => {
        // Fetch with pagination (client-side for now)
        const result = await getSuperAdmins(limit, offset);
        return result.items.map(mapSuperAdminToItem);
      },
      fetchCandidates: createFetchCandidates('Admin,Supervisor,PSO,Unassigned'),
      addItems: async (emails: string[]) => {
        await Promise.all(emails.map((email) => createSuperAdmin(email)));
      },
      removeItem: async (item: SuperAdminItem) => {
        if (!item.id) {
          throw new Error('SuperAdmin item must have an id for deletion');
        }
        await deleteSuperAdmin(item.id);
      },
    },
    ui: {
      title: 'Super Admins',
      addButtonLabel: 'Add Super Admin',
      modalTitle: 'Add Super Admins',
      confirmLabel: 'Promote to Super Admin',
      loadingAction: 'Loading super admins',
      candidatesLoadingAction: 'Loading candidates',
      addSuccessMessage: '{count} super admin(s) added',
      removeSuccessMessage: 'Removed {email}',
      fetchErrorMessage: 'Failed to load Super Admins',
      addErrorMessage: 'Failed to add super admins',
      removeErrorMessage: 'Failed to remove super admin',
    },
    columns: {
      mainColumns: createCommonMainColumns<SuperAdminItem>([
        {
          key: 'role',
          header: 'Role',
          render: (row: SuperAdminItem) => row.role || 'Super Admin',
        },
      ]),
      candidateColumns: createCandidateColumns<UserByRole>(),
    },
    features: {
      minItemsForDeletion: 1, // Prevent deleting last SuperAdmin
    },
  };
}

