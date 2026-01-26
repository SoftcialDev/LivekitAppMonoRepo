/**
 * @fileoverview useStablePSOs - Hook for maintaining a stable list of PSOs
 * @description Maintains a stable list of PSOs that only updates when the presence store actually changes.
 * Prevents unnecessary re-renders by comparing user properties before recalculating the list.
 * Filters PSOs based on viewer role and supervisor assignments.
 */

import { useMemo, useRef } from 'react';
import { usePresenceStore, PresenceStatus } from '@/modules/presence';
import type { UserStatus } from '@/modules/presence';
import type { PSOWithStatus } from '../../types';

/**
 * Maintains a stable list of PSOs that only updates when user data actually changes
 * @param viewerEmail - Email of the user viewing the PSO list
 * @param viewerRole - Role of the user viewing (Admin, Supervisor, PSO, etc.)
 * @param viewerAzureAdObjectId - Azure AD Object ID of the viewer (used for supervisor filtering)
 * @returns Array of PSOs with status information, sorted by online status
 */
export function useStablePSOs(
  viewerEmail: string,
  viewerRole?: string,
  viewerAzureAdObjectId?: string
): PSOWithStatus[] {
  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const lastUsersRef = useRef<UserStatus[]>([]);
  const lastResultRef = useRef<PSOWithStatus[]>([]);

  return useMemo(() => {
    const currentUsers = onlineUsers;
    const lastUsers = lastUsersRef.current;
    
    const currentEmails = new Set(currentUsers.map(u => u.email.toLowerCase()));
    const lastEmails = new Set(lastUsers.map(u => u.email.toLowerCase()));
    
    const emailsChanged = currentEmails.size !== lastEmails.size ||
      currentUsers.some(u => !lastEmails.has(u.email.toLowerCase())) ||
      lastUsers.some(u => !currentEmails.has(u.email.toLowerCase()));
    
    if (!emailsChanged && currentUsers.length === lastUsers.length) {
      const hasChanges = currentUsers.some((user, index) => {
        const lastUser = lastUsers[index];
        return !lastUser || 
               user.email !== lastUser.email || 
               user.status !== lastUser.status ||
               user.supervisorEmail !== lastUser.supervisorEmail ||
               user.supervisorId !== lastUser.supervisorId ||
               user.platform !== lastUser.platform ||
               user.role !== lastUser.role;
      });
      
      if (!hasChanges) {
        return lastResultRef.current;
      }
    }

    const decorate = (u: UserStatus): PSOWithStatus => {
      let supervisorName = u.supervisorEmail || (u.supervisorId ? 'Supervisor Assigned' : '—');
      
      if (u.supervisorId && !u.supervisorEmail) {
        const supervisor = onlineUsers.find(user => 
          user.azureAdObjectId === u.supervisorId || 
          user.email === u.supervisorId ||
          user.supervisorId === u.supervisorId
        );
        
        if (supervisor) {
          supervisorName = supervisor.email;
        }
      }
      
      return {
        email: u.email,
        fullName: u.fullName ?? u.name ?? u.email,
        name: u.fullName ?? u.name ?? u.email,
        status: u.status === PresenceStatus.Online ? 'online' : 'offline',
        isOnline: u.status === PresenceStatus.Online,
        supervisorName,
        supervisorEmail: u.supervisorEmail ?? undefined,
        platform: u.platform ?? undefined,
      };
    };

    const filteredUsers = onlineUsers.filter(u => {
      if (u.email.toLowerCase() === viewerEmail.toLowerCase()) {
        return false;
      }
      
      if (u.role && u.role !== 'PSO') {
        return false;
      }
      
      if (viewerRole === 'Admin' || viewerRole === 'SuperAdmin') {
        return true;
      } else if (viewerRole === 'Supervisor') {
        if (!viewerAzureAdObjectId) {
          return false;
        }
        return u.supervisorId === viewerAzureAdObjectId || 
               u.supervisorEmail === viewerEmail;
      }
      
      return true;
    });

    const result = filteredUsers
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

    lastUsersRef.current = [...currentUsers];
    lastResultRef.current = result;

    return result;
  }, [onlineUsers, viewerEmail, viewerRole, viewerAzureAdObjectId]);
}

