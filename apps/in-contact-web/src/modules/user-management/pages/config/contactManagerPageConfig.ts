/**
 * @fileoverview Contact Manager page configuration
 * @summary Configuration for Contact Manager user management page
 * @description Defines API functions, UI labels, and columns for Contact Manager page
 */

import { ManagerStatus } from '@/modules/presence/enums/managerStatusEnums';
import {
  getContactManagers,
  upsertContactManager,
  revokeContactManager,
} from '../../api/contactManagerClient';
import type {
  ContactManagerDto,
  UserManagementConfig,
  BaseUserManagementItem,
  CandidateUser,
} from '../../types';
import {
  mapFullNameToItem,
  createFetchCandidates,
  createCandidateColumns,
  createCommonMainColumns,
} from './sharedConfigUtils';

/**
 * Contact Manager item type (extends ContactManagerDto with BaseUserManagementItem)
 */
export type ContactManagerItem = ContactManagerDto & BaseUserManagementItem;

/**
 * Maps ContactManagerDto to ContactManagerItem with firstName/lastName split
 *
 * @param dto - ContactManagerDto from API
 * @returns ContactManagerItem with firstName and lastName
 */
function mapContactManagerToItem(dto: ContactManagerDto): ContactManagerItem {
  return mapFullNameToItem(dto, {
    id: dto.id,
    role: 'ContactManager',
  });
}

/**
 * Creates the configuration for Contact Manager page
 *
 * @returns UserManagementConfig for Contact Manager page
 */
export function createContactManagerPageConfig(): UserManagementConfig<ContactManagerItem> {
  return {
    api: {
      fetchTotalCount: async () => {
        // Fetch all to get totalCount (API returns all items currently)
        const result = await getContactManagers();
        return result.totalCount;
      },
      onFetch: async (limit: number, offset: number) => {
        // Fetch with pagination (client-side for now)
        const result = await getContactManagers(limit, offset);
        return result.items.map(mapContactManagerToItem);
      },
      fetchCandidates: createFetchCandidates('Admin,Supervisor,PSO,Unassigned'),
      addItems: async (emails: string[]) => {
        await Promise.all(
          emails.map((email) =>
            upsertContactManager({ email, status: ManagerStatus.Unavailable })
          )
        );
      },
      removeItem: async (item: ContactManagerItem) => {
        if (!item.id) {
          throw new Error('ContactManager item must have an id for deletion');
        }
        await revokeContactManager(item.id);
      },
    },
    ui: {
      title: 'Contact Managers',
      addButtonLabel: 'Add Contact Manager',
      modalTitle: 'Add Contact Managers',
      confirmLabel: 'Add Contact Managers',
      loadingAction: 'Loading contact managers',
      candidatesLoadingAction: 'Loading candidates',
      addSuccessMessage: '{count} contact manager(s) added',
      removeSuccessMessage: 'Removed {email}',
      fetchErrorMessage: 'Failed to load Contact Managers',
      addErrorMessage: 'Failed to add contact managers',
      removeErrorMessage: 'Failed to remove contact manager',
    },
    columns: {
      mainColumns: createCommonMainColumns<ContactManagerItem>([
        { key: 'status', header: 'Status' },
        { key: 'role', header: 'Role' },
      ]),
      candidateColumns: createCandidateColumns<CandidateUser>(),
    },
  };
}

