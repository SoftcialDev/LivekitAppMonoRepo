/**
 * @fileoverview Sidebar utility functions
 * @summary Helper functions for sidebar operations
 * @description Utility functions for filtering, formatting, and processing users in the sidebar
 */

import type { UserStatus } from '@/modules/presence/types/presenceTypes';
import { ROLE_OPTIONS } from '../constants/sidebarConstants';

/**
 * Formats a user's full name to a short display format (First Last)
 * 
 * Takes the first two words from the full name and joins them.
 * If no fullName is available, falls back to name or email.
 * 
 * @param user - User status object with name information
 * @returns Short display name (e.g., "John Doe")
 * 
 * @example
 * ```typescript
 * const short = shortName({ fullName: "John Michael Doe", name: "John Doe", email: "john@example.com" });
 * // Returns: "John Michael"
 * ```
 */
export function shortName(user: UserStatus): string {
  const nameText = (user.fullName ?? user.name ?? user.email).trim();
  return nameText.split(/\s+/).slice(0, 2).join(' ');
}

/**
 * Filters a list of users by search term and role filter
 * 
 * Applies two filters:
 * - Text search: matches against fullName, name, or email (case-insensitive)
 * - Role filter: matches exact role if provided (empty string means "all roles")
 * 
 * @param list - Array of users to filter
 * @param searchTerm - Text to search for (case-insensitive)
 * @param roleFilter - Role to filter by (empty string = all roles)
 * @returns Filtered array of users
 * 
 * @example
 * ```typescript
 * const filtered = filterUsers(users, "john", UserRole.PSO);
 * // Returns users matching "john" with role PSO
 * ```
 */
export function filterUsers(
  list: UserStatus[],
  searchTerm: string,
  roleFilter: string
): UserStatus[] {
  return list.filter((user) => {
    // Apply role filter if specified
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }

    // Apply text search if specified
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameText = (user.fullName ?? user.name ?? user.email).toLowerCase();
      if (!nameText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Excludes the current user from a list of users
 * 
 * Compares emails in a case-insensitive manner.
 * 
 * @param users - Array of users to filter
 * @param currentEmail - Email of the current user to exclude
 * @returns Filtered array excluding the current user
 * 
 * @example
 * ```typescript
 * const otherUsers = excludeCurrentUser(users, 'user@example.com');
 * ```
 */
export function excludeCurrentUser(users: UserStatus[], currentEmail: string | null | undefined): UserStatus[] {
  if (!currentEmail) {
    return users;
  }
  
  const emailLower = currentEmail.toLowerCase().trim();
  return users.filter((user) => user.email.toLowerCase().trim() !== emailLower);
}

/**
 * Filters offline users to exclude those with invalid roles
 * 
 * Excludes users with role "Unassigned" or null/undefined from the offline list.
 * 
 * @param users - Array of offline users to filter
 * @returns Filtered array with only valid offline users
 * 
 * @example
 * ```typescript
 * const validOffline = filterValidOfflineUsers(offlineUsers);
 * ```
 */
export function filterValidOfflineUsers(users: UserStatus[]): UserStatus[] {
  return users.filter((u) => {
    const role = u.role as string | null | undefined;
    return role !== 'Unassigned' && role !== null && role !== undefined;
  });
}

/**
 * Gets effective role options based on user role
 * 
 * For PSO users: returns only Contact Managers option (locked)
 * For other users: returns all role options
 * 
 * @param isPso - Whether the current user is a PSO
 * @returns Array of role options with label and value
 * 
 * @example
 * ```typescript
 * const options = getEffectiveRoleOptions(true);
 * // Returns: [{ label: 'Contact Managers', value: UserRole.ContactManager }]
 * ```
 */
export function getEffectiveRoleOptions(isPso: boolean): Array<{ label: string; value: string }> {
  if (isPso) {
    return [{ label: 'Contact Managers', value: 'ContactManager' }];
  }
  return ROLE_OPTIONS.map((r) => ({ label: r.label, value: r.value }));
}

/**
 * Calculates the max height for a scrollable user list
 * 
 * If the item count is below the threshold, returns 'auto'.
 * Otherwise, returns the maximum height in pixels.
 * 
 * @param itemCount - Number of items in the list
 * @param maxItemsWithoutScroll - Maximum items before scrolling is enabled (default: 5)
 * @param maxHeightPx - Maximum height in pixels when scrolling (default: 128)
 * @returns 'auto' or max height in pixels
 * 
 * @example
 * ```typescript
 * const height = calculateScrollMaxHeight(10); // Returns: 128
 * const height2 = calculateScrollMaxHeight(3); // Returns: 'auto'
 * ```
 */
export function calculateScrollMaxHeight(
  itemCount: number,
  maxItemsWithoutScroll: number = 5,
  maxHeightPx: number = 128
): string | number {
  return itemCount <= maxItemsWithoutScroll ? 'auto' : maxHeightPx;
}

