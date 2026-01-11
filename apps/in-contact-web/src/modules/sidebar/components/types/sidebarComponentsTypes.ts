/**
 * @fileoverview Sidebar component type definitions
 * @summary Type definitions for sidebar components
 * @description Defines interfaces for sidebar-related components
 */

import React from 'react';
import type { UserStatus } from '@/modules/presence/types/presenceTypes';
import { ManagerStatus } from '@/modules/presence/enums';
import type { IUseSidebarNavigationReturn } from '../../types';

/**
 * Props for Sidebar component
 */
export interface ISidebarProps {
  /**
   * Users currently online (presence feed)
   */
  onlineUsers: UserStatus[];

  /**
   * Users currently offline (presence feed)
   */
  offlineUsers: UserStatus[];

  /**
   * Whether the sidebar is collapsed
   */
  isCollapsed: boolean;

  /**
   * Toggle the collapse state
   */
  onToggleCollapse: () => void;
}

/**
 * Props for UserItem component
 */
export interface IUserItemProps {
  /**
   * The user to display
   * Optionally includes a Contact Manager availability state as cmStatus
   */
  user: UserStatus & { cmStatus?: ManagerStatus };

  /**
   * Callback invoked when the "Chat" button is pressed
   * 
   * @param email - User email
   */
  onChat: (email: string) => void;
}

/**
 * Props for UserIndicator component
 */
export interface IUserIndicatorProps {
  /**
   * The user object containing at least name (displayed) and email
   */
  user: UserStatus;

  /**
   * Tailwind classes for the outer container size
   * Defaults to "w-8 h-8"
   */
  outerClass?: string;

  /**
   * Tailwind classes for the inner circle size
   * If omitted, outerClass is reused
   */
  innerClass?: string;

  /**
   * Tailwind classes for the inner circle background
   * Defaults to "bg-[var(--color-secondary)]"
   */
  bgClass?: string;

  /**
   * Tailwind classes for the inner circle border
   * Defaults to "border-2 border-[var(--color-primary-dark)]"
   */
  borderClass?: string;

  /**
   * Tailwind classes for the username span
   */
  nameClass?: string;
}

/**
 * Props for ChatButton component
 */
export interface IChatButtonProps {
  /**
   * User's email address
   */
  userEmail: string;

  /**
   * User's display name (for accessibility)
   */
  userName?: string | null;

  /**
   * Callback invoked when button is clicked
   * 
   * @param email - User email
   */
  onChat: (email: string) => void;
}

/**
 * Props for SidebarToggle component
 */
export interface ISidebarToggleProps {
  /**
   * Whether the sidebar is currently collapsed
   */
  isCollapsed: boolean;

  /**
   * Callback to toggle the sidebar visibility
   */
  onToggle: () => void;
}

/**
 * Props for UserSearchInput component
 */
export interface IUserSearchInputProps {
  /**
   * Current search term value
   */
  value: string;

  /**
   * Callback when search term changes
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;
}

/**
 * Props for UserList component
 */
export interface IUserListProps {
  /**
   * Title/label for the list (e.g., "Online (5)")
   */
  title: string;

  /**
   * List of users to display
   */
  users: UserStatus[];

  /**
   * Callback when chat button is clicked
   */
  onChat: (email: string) => void;
}

/**
 * Props for SidebarDashboardSection component
 */
export interface ISidebarDashboardSectionProps {
  /**
   * Navigation render helper
   */
  renderNavLink: IUseSidebarNavigationReturn['renderNavLink'];
}

/**
 * Props for SidebarManageSection component
 */
export interface ISidebarManageSectionProps {
  /**
   * Whether current user is SuperAdmin
   */
  isSuperAdmin: boolean;

  /**
   * Whether current user is Admin
   */
  isAdmin: boolean;

  /**
   * Whether current user is Supervisor
   */
  isSupervisor: boolean;

  /**
   * Current user's email
   */
  currentEmail: string;

  /**
   * Navigation render helper
   */
  renderNavLink: IUseSidebarNavigationReturn['renderNavLink'];
}
