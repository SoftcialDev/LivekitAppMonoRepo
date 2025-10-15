import { usePresenceStore } from './usePresenceStore';
import { UserStatus } from '../types/UserStatus';

/**
 * Hook para obtener el estado de un usuario específico
 * Solo se actualiza cuando cambia ese usuario específico
 */
export function usePresenceUser(email: string): UserStatus | null {
  return usePresenceStore((state) => {
    // Buscar en onlineUsers primero
    const onlineUser = state.onlineUsers.find(user => user.email === email);
    if (onlineUser) return onlineUser;
    
    // Si no está online, buscar en offlineUsers
    const offlineUser = state.offlineUsers.find(user => user.email === email);
    return offlineUser || null;
  });
}

/**
 * Hook para obtener solo los usuarios online
 * Solo se actualiza cuando cambia la lista de usuarios online
 */
export function useOnlineUsers(): UserStatus[] {
  return usePresenceStore((state) => state.onlineUsers);
}

/**
 * Hook para obtener solo los usuarios offline
 * Solo se actualiza cuando cambia la lista de usuarios offline
 */
export function useOfflineUsers(): UserStatus[] {
  return usePresenceStore((state) => state.offlineUsers);
}

/**
 * Hook para obtener el estado de loading
 * Solo se actualiza cuando cambia el estado de loading
 */
export function usePresenceLoading(): boolean {
  return usePresenceStore((state) => state.loading);
}

/**
 * Hook para obtener el error
 * Solo se actualiza cuando cambia el error
 */
export function usePresenceError(): string | null {
  return usePresenceStore((state) => state.error);
}

/**
 * Hook para obtener si un usuario específico está online
 * Solo se actualiza cuando cambia el estado de ese usuario
 */
export function useIsUserOnline(email: string): boolean {
  return usePresenceStore((state) => {
    return state.onlineUsers.some(user => user.email === email);
  });
}

/**
 * Hook para obtener la información de un usuario específico con supervisor
 * Solo se actualiza cuando cambia ese usuario específico
 */
export function useUserWithSupervisor(email: string): {
  user: UserStatus | null;
  supervisorEmail: string | null;
} {
  return usePresenceStore((state) => {
    // Buscar el usuario
    const user = state.onlineUsers.find(u => u.email === email) || 
                 state.offlineUsers.find(u => u.email === email) || 
                 null;
    
    if (!user) {
      return { user: null, supervisorEmail: null };
    }
    
    // ✅ SIMPLIFICADO: Solo usar supervisorEmail si ya existe
    // No buscar dinámicamente para evitar bucles infinitos
    return { 
      user, 
      supervisorEmail: user.supervisorEmail || null 
    };
  });
}
