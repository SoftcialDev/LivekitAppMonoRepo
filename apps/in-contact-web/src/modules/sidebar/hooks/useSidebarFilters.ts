/**
 * @fileoverview useSidebarFilters hook
 * @summary Hook for managing sidebar search and role filters
 * @description Manages search term, role filter state, and provides filtered user lists
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { UserStatus } from '@/modules/presence/types/presenceTypes';
import {
  filterUsers,
  filterValidOfflineUsers,
  getEffectiveRoleOptions,
  excludeCurrentUser,
} from '../utils/sidebarUtils';
import type { IUseSidebarFiltersReturn } from '../types';

/**
 * Hook for managing sidebar filters
 *
 * Manages search term and role filter state, and provides filtered user lists
 * based on the current filters. Automatically excludes the current user from
 * both online and offline lists. For PSO users, the role filter is locked to
 * Contact Managers only.
 *
 * @param onlineUsers - List of online users
 * @param offlineUsers - List of offline users
 * @param isPso - Whether the current user is a PSO
 * @param currentEmail - Email of the current user (to exclude from lists)
 * @returns Object with filter state, filtered lists, and handlers
 *
 * @example
 * ```typescript
 * const {
 *   searchTerm,
 *   roleFilter,
 *   filteredOnline,
 *   filteredOffline,
 *   handleSearch,
 *   handleRoleFilterChange
 * } = useSidebarFilters(onlineUsers, offlineUsers, isPso, currentEmail);
 * ```
 */
export function useSidebarFilters(
  onlineUsers: UserStatus[],
  offlineUsers: UserStatus[],
  isPso: boolean,
  currentEmail: string | null | undefined
): IUseSidebarFiltersReturn {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>(isPso ? 'ContactManager' : '');

  // Effective role options based on user role
  const effectiveRoleOptions = useMemo(
    () => getEffectiveRoleOptions(isPso),
    [isPso]
  );

  // Handle search input change
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle role filter change
  const handleRoleFilterChange = useCallback((value: string | number) => {
    setRoleFilter(String(value));
  }, []);

  // Filter online users (exclude current user first, then apply search/role filters)
  const filteredOnline = useMemo(() => {
    const withoutCurrentUser = excludeCurrentUser(onlineUsers, currentEmail);
    return filterUsers(withoutCurrentUser, searchTerm, roleFilter);
  }, [onlineUsers, currentEmail, searchTerm, roleFilter]);

  // Filter offline users (exclude current user, invalid roles, then apply search/role filters)
  const filteredOffline = useMemo(() => {
    const withoutCurrentUser = excludeCurrentUser(offlineUsers, currentEmail);
    const validOffline = filterValidOfflineUsers(withoutCurrentUser);
    return filterUsers(validOffline, searchTerm, roleFilter);
  }, [offlineUsers, currentEmail, searchTerm, roleFilter]);

  return {
    searchTerm,
    roleFilter,
    effectiveRoleOptions,
    filteredOnline,
    filteredOffline,
    handleSearch,
    handleRoleFilterChange,
  };
}

