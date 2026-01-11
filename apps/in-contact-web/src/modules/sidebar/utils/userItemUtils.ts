/**
 * @fileoverview UserItem utility functions
 */

import { PresenceStatus, ManagerStatus } from '@/modules/presence/enums';
import { UserRole } from '@/modules/auth/enums';
import type { UserStatus } from '@/modules/presence/types/presenceTypes';

/**
 * Determines the background color class for Contact Manager status indicators
 * 
 * @param userStatus - User's presence status
 * @param cmStatus - Contact Manager availability status
 * @returns Tailwind CSS class for indicator background color
 */
export function getCMIndicatorColor(
  userStatus: PresenceStatus,
  cmStatus?: ManagerStatus
): string {
  if (userStatus !== PresenceStatus.Online) {
    return 'bg-[var(--color-secondary)]';
  }

  switch (cmStatus) {
    case ManagerStatus.OnBreak:
      return 'bg-[var(--color-cm-break)]';
    case ManagerStatus.OnAnotherTask:
      return 'bg-[var(--color-cm-busy)]';
    case ManagerStatus.Unavailable:
      return 'bg-[var(--color-cm-unavailable)]';
    case ManagerStatus.Available:
      return 'bg-[var(--color-secondary)]';
    default:
      return 'bg-[var(--color-secondary)]';
  }
}

/**
 * Determines the CSS class for user name text color based on online status
 * 
 * @param status - User's presence status
 * @returns Tailwind CSS class for name text color
 */
export function getNameTextColor(status: PresenceStatus): string {
  return status === PresenceStatus.Online
    ? 'font-light text-white truncate'
    : 'text-[var(--color-tertiary)] truncate';
}

