/**
 * @fileoverview Sidebar hooks type definitions
 * @summary Type definitions for sidebar hooks return values
 * @description Defines interfaces for all sidebar hooks return types
 */

import React from 'react';
import type { UserStatus } from '@/modules/presence/types/presenceTypes';

/**
 * Return type for useSidebarRoleFlags hook
 */
export interface IUseSidebarRoleFlagsReturn {
  /**
   * Whether the current user is an Admin
   */
  isAdmin: boolean;

  /**
   * Whether the current user is a Supervisor
   */
  isSupervisor: boolean;

  /**
   * Whether the current user is a SuperAdmin
   */
  isSuperAdmin: boolean;

  /**
   * Whether the current user is a PSO
   */
  isPso: boolean;
}

/**
 * Return type for useSidebarFilters hook
 */
export interface IUseSidebarFiltersReturn {
  /**
   * Current search term
   */
  searchTerm: string;

  /**
   * Current role filter value
   */
  roleFilter: string;

  /**
   * Effective role options based on user role
   */
  effectiveRoleOptions: Array<{ label: string; value: string }>;

  /**
   * Filtered list of online users
   */
  filteredOnline: UserStatus[];

  /**
   * Filtered list of offline users
   */
  filteredOffline: UserStatus[];

  /**
   * Handler for search input changes
   */
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Handler for role filter changes
   */
  handleRoleFilterChange: (value: string | number) => void;
}

/**
 * Return type for useSidebarNavigation hook
 */
export interface IUseSidebarNavigationReturn {
  /**
   * Renders a navigation link, disabled if the route is not implemented
   * 
   * @param to - Route path
   * @param children - Link content
   * @param disabled - Optional flag to force disabled state
   * @returns React node with NavLink or disabled span
   */
  renderNavLink: (to: string, children: React.ReactNode, disabled?: boolean) => React.ReactNode;
}

