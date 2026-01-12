/**
 * @fileoverview useStablePSOs hook
 * @summary Hook for maintaining a stable list of PSOs
 * @description Maintains a stable list of PSOs that only updates when the presence store actually changes. Avoids unnecessary re-renders when the presence store updates.
 */

import { useMemo, useRef } from 'react';
import { usePresenceStore, PresenceStatus } from '@/modules/presence';
import type { UserStatus } from '@/modules/presence';
import type { PSOWithStatus } from '../../types';

/**
 * Hook that maintains a stable list of PSOs
 * Only updates when the list of online users actually changes
 * Avoids unnecessary re-renders when the presence store changes
 * 
 * @param viewerEmail - Email of the user viewing
 * @param viewerRole - Role of the user viewing
 * @param viewerAzureAdObjectId - Azure AD Object ID of the user viewing (for supervisors)
 * @returns Array of PSOs with status information
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
    // Optimization: Only recalculate if the user list actually changed
    const currentUsers = onlineUsers;
    const lastUsers = lastUsersRef.current;
    
    // Compare if the list actually changed
    if (currentUsers.length === lastUsers.length) {
      const hasChanges = currentUsers.some((user, index) => {
        const lastUser = lastUsers[index];
        return !lastUser || 
               user.email !== lastUser.email || 
               user.status !== lastUser.status ||
               user.supervisorEmail !== lastUser.supervisorEmail;
      });
      
      if (!hasChanges) {
        return lastResultRef.current;
      }
    }

    const decorate = (u: UserStatus): PSOWithStatus => {
      // If we have supervisorId but no supervisorEmail, try to find it in the presence store
      let supervisorName = u.supervisorEmail || (u.supervisorId ? 'Supervisor Assigned' : '—');
      
      if (u.supervisorId && !u.supervisorEmail) {
        // Look for the supervisor in the presence store
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
      };
    };

    // Filter based on viewer role and supervisor assignment
    const filteredUsers = onlineUsers.filter(u => {
      // Don't show self
      if (u.email.toLowerCase() === viewerEmail.toLowerCase()) {
        return false;
      }
      
      // Only show PSO (including those with undefined role, assuming they are PSO)
      // Note: UserRole.PSO enum value should match 'PSO' string
      if (u.role && u.role !== 'PSO') {
        return false;
      }
      
      // Role-based filtering
      if (viewerRole === 'Admin' || viewerRole === 'SuperAdmin') {
        // Admins and SuperAdmins can see all PSOs
        return true;
      } else if (viewerRole === 'Supervisor') {
        // Supervisors can only see PSOs assigned to them
        if (!viewerAzureAdObjectId) {
          return false;
        }
        // Check if this PSO is assigned to the current supervisor
        // Compare by both supervisorId (Azure AD Object ID) and supervisorEmail
        return u.supervisorId === viewerAzureAdObjectId || 
               u.supervisorEmail === viewerEmail;
      }
      
      // Default: show all PSOs (fallback for unknown roles)
      return true;
    });

    const result = filteredUsers
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

    // Cache the result
    lastUsersRef.current = [...currentUsers];
    lastResultRef.current = result;

    return result;
  }, [onlineUsers, viewerEmail, viewerRole, viewerAzureAdObjectId]);
}

