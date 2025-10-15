import { useMemo, useRef } from 'react';
import { usePresenceStore } from '@/shared/presence/usePresenceStore';
import { PSOWithStatus } from '@/shared/types/PsosWithStatus';
import { UserStatus } from '@/shared/types/UserStatus';

/**
 * Hook que mantiene una lista ESTABLE de PSOs
 * Solo se actualiza cuando realmente cambia la lista de usuarios online
 * Evita re-renders innecesarios cuando el presence store cambia
 */
export function useStablePSOs(viewerEmail: string, viewerRole?: string) {
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
        console.log('✅ [useStablePSOs] No changes in user list, returning cached result');
        return lastResultRef.current;
      }
    }

    console.log('🔄 [useStablePSOs] User list changed, recalculating PSOs');

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
      };
    };

    // Filter based on viewer role
    const filteredUsers = onlineUsers.filter(u => {
      // Don't show self
      if (u.email.toLowerCase() === viewerEmail.toLowerCase()) {
        return false;
      }
      
      // Only show employees (including those with undefined role, assuming they are employees)
      if (u.role !== 'Employee' && u.role !== undefined) {
        return false;
      }
      
      return true; // Show all employees for now
    });

    const result = filteredUsers
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

    // ✅ Cache the result
    lastUsersRef.current = [...currentUsers];
    lastResultRef.current = result;

    console.log('✅ [useStablePSOs] PSOs calculated:', result.length);
    return result;
  }, [onlineUsers, viewerEmail, viewerRole]);
}
