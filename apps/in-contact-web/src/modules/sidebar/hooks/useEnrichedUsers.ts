/**
 * @fileoverview useEnrichedUsers hook
 * @summary Hook for enriching UserStatus objects with Contact Manager status
 * @description Enriches UserStatus objects with cmStatus from Contact Manager data
 */

import { useMemo } from 'react';
import { useContactManagerStatus, ManagerStatus, UserStatus } from '@/modules/presence';
import type {
  IUseEnrichedUsersOptions,
  IUseEnrichedUsersReturn,
} from './types/useEnrichedUsersTypes';

/**
 * Hook for enriching UserStatus objects with Contact Manager status
 * 
 * Fetches Contact Manager statuses and creates a map to enrich UserStatus objects
 * with cmStatus field for Contact Managers
 * 
 * @param onlineUsers - Array of online UserStatus objects
 * @param offlineUsers - Array of offline UserStatus objects
 * @param options - Configuration options
 * @returns Enriched user arrays with cmStatus
 */
export function useEnrichedUsers(
  onlineUsers: UserStatus[],
  offlineUsers: UserStatus[],
  options: IUseEnrichedUsersOptions
): IUseEnrichedUsersReturn {
  const { managers: contactManagers } = useContactManagerStatus(
    options.shouldFetch ? options.userEmail : ''
  );

  // Create map of email -> cmStatus for Contact Managers
  const cmStatusByEmail = useMemo(() => {
    const map = new Map<string, ManagerStatus>();
    contactManagers.forEach((cm) => {
      map.set(cm.email.toLowerCase(), cm.status);
    });
    return map;
  }, [contactManagers]);

  // Enrich UserStatus objects with cmStatus
  const enrichedOnlineUsers = useMemo<UserStatus[]>(() => {
    return onlineUsers.map((user) => {
      const cmStatus = cmStatusByEmail.get(user.email.toLowerCase());
      return cmStatus ? { ...user, cmStatus } : user;
    });
  }, [onlineUsers, cmStatusByEmail]);

  const enrichedOfflineUsers = useMemo<UserStatus[]>(() => {
    return offlineUsers.map((user) => {
      const cmStatus = cmStatusByEmail.get(user.email.toLowerCase());
      return cmStatus ? { ...user, cmStatus } : user;
    });
  }, [offlineUsers, cmStatusByEmail]);

  return {
    enrichedOnlineUsers,
    enrichedOfflineUsers,
  };
}

