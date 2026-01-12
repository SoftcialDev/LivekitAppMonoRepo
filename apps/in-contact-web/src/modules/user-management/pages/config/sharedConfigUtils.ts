/**
 * @fileoverview Shared configuration utilities for user management pages
 * @summary Common functions for creating user management page configurations
 * @description Provides shared utilities for mapping DTOs to items and creating page configurations
 */

import type { Column } from '@/ui-kit/tables';
import { getUsersByRole } from '../../api/adminClient';
import type {
  BaseUserManagementItem,
  CandidateUser,
  UserRoleParam,
} from '../../types';
import { BASE_CANDIDATE_COLUMNS } from './sharedColumns';

/**
 * Maps a DTO with fullName to an item with firstName and lastName
 *
 * @param dto - DTO with fullName and email properties
 * @param additionalFields - Additional fields to merge into the result
 * @returns Item with firstName and lastName split from fullName
 */
export function mapFullNameToItem<T extends { fullName?: string | null; email: string }>(
  dto: T,
  additionalFields?: Partial<BaseUserManagementItem>
): T & BaseUserManagementItem {
  const parts = (dto.fullName ?? '').trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');

  return {
    ...dto,
    firstName,
    lastName,
    ...additionalFields,
  } as T & BaseUserManagementItem;
}

/**
 * Creates a standard fetchCandidates function for user management pages
 *
 * @param roles - Comma-separated list of roles to fetch (must be valid UserRoleParam)
 * @returns Function that fetches candidate users by role
 */
export function createFetchCandidates(roles: UserRoleParam) {
  return async (): Promise<CandidateUser[]> => {
    const response = await getUsersByRole(roles, 1, 1000);
    return response.users.map((user) => ({
      ...user,
      id: user.azureAdObjectId || user.email,
    }));
  };
}

/**
 * Creates standard candidate columns configuration
 *
 * @returns Column configuration for candidate tables
 */
export function createCandidateColumns<T extends CandidateUser>(): Column<T>[] {
  return BASE_CANDIDATE_COLUMNS as Column<T>[];
}

/**
 * Creates common main columns for user management pages
 * 
 * @template T Item type that extends BaseUserManagementItem
 * @param additionalColumns - Additional columns to include after the common ones
 * @returns Array of column definitions
 */
export function createCommonMainColumns<T extends BaseUserManagementItem>(
  additionalColumns: Column<T>[] = []
): Column<T>[] {
  return [
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'email', header: 'Email' },
    ...additionalColumns,
  ];
}

