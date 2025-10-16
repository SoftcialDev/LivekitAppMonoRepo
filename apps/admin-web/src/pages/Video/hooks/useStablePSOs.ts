import { useMemo, useRef } from 'react';
import { usePresenceStore } from '@/shared/presence/usePresenceStore';
import { PSOWithStatus } from '@/shared/types/PsosWithStatus';
import { UserStatus } from '@/shared/types/UserStatus';

/**
 * Hook que mantiene una lista ESTABLE de PSOs
 * Solo se actualiza cuando realmente cambia la lista de usuarios online
 * Evita re-renders innecesarios cuando el presence store cambia
 * 
 * @param viewerEmail - Email del usuario que está viendo
 * @param viewerRole - Rol del usuario que está viendo
 * @param viewerAzureAdObjectId - Azure AD Object ID del usuario que está viendo (para supervisores)
 */
export function useStablePSOs(viewerEmail: string, viewerRole?: string, viewerAzureAdObjectId?: string) {
  const onlineUsers = usePresenceStore(state => state.onlineUsers);
  const lastUsersRef = useRef<UserStatus[]>([]);
  const lastResultRef = useRef<PSOWithStatus[]>([]);

  return useMemo(() => {
    // ✅ OPTIMIZACIÓN: Solo recalcular si realmente cambió la lista de usuarios
    const currentUsers = onlineUsers;
    const lastUsers = lastUsersRef.current;
    
    // Comparar si realmente cambió la lista
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
        email:    u.email,
        fullName: u.fullName ?? u.name ?? u.email,
        name:     u.fullName ?? u.name ?? u.email,
        status:   (u.status === 'online' ? 'online' : 'offline') as PSOWithStatus['status'],
        isOnline: u.status === 'online',
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
      
      // Only show employees (including those with undefined role, assuming they are employees)
      if (u.role !== 'Employee' && u.role !== undefined) {
        return false;
      }
      
      // Role-based filtering
      if (viewerRole === 'Admin' || viewerRole === 'SuperAdmin') {
        // Admins and SuperAdmins can see all employees
        return true;
      } else if (viewerRole === 'Supervisor') {
        // Supervisors can only see employees assigned to them
        if (!viewerAzureAdObjectId) {
          console.warn('Supervisor role detected but no azureAdObjectId provided');
          return false;
        }
        // Check if this employee is assigned to the current supervisor
        // Compare by both supervisorId (Azure AD Object ID) and supervisorEmail
        return u.supervisorId === viewerAzureAdObjectId || 
               u.supervisorEmail === viewerEmail;
      }
      
      // Default: show all employees (fallback for unknown roles)
      return true;
    });

    const result = filteredUsers
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

    // ✅ Cache the result
    lastUsersRef.current = [...currentUsers];
    lastResultRef.current = result;

    return result;
  }, [onlineUsers, viewerEmail, viewerRole, viewerAzureAdObjectId]);
}
