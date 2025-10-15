/**
 * @fileoverview usePSOsWithPresenceSync - Hook that combines PSOs with presence data and auto-sync
 * @summary Custom hook that synchronizes presence store with authorized PSOs
 * @description This hook combines useMyPsos and usePresenceStore to automatically
 * sync when new employees come online, ensuring the PSO list stays up-to-date
 * without causing unnecessary re-renders.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePresenceStore } from '@/shared/presence/usePresenceStore';
import { useMyPsos } from './useMyPsos';
import { PSOWithStatus } from '@/shared/types/PsosWithStatus';
import { UserStatus } from '@/shared/types/UserStatus';

/**
 * Hook that combines PSOs with presence data and auto-syncs new users
 * @param viewerEmail - Email of the current viewer (supervisor)
 * @returns Object containing filtered PSOs, loading state, and error state
 */
export const usePSOsWithPresenceSync = (viewerEmail: string) => {
  // Presence data from store
  const onlineUsers = usePresenceStore(s => s.onlineUsers);
  const presenceLoading = usePresenceStore(s => s.loading);
  const presenceError = usePresenceStore(s => s.error);
  
  // PSO metadata from API
  const { psos: myPsoMeta, loading: psosLoading, error: psosError, refetch: refetchPsos } = useMyPsos();
  
  // Create supervisor map for display names
  const supMap = useMemo(
    () =>
      new Map(
        (myPsoMeta ?? [])
          .filter((p: any): p is { email: string; supervisorName: string } => !!p?.email)
          .map((p: any) => [p.email.toLowerCase(), p.supervisorName])
      ),
    [myPsoMeta]
  );
  
  // Authorized emails from API
  const allowedEmails = useMemo(() => new Set(supMap.keys()), [supMap]);
  
  // Auto-sync when new employees come online
  useEffect(() => {
    console.log('🔄 [usePSOsWithPresenceSync] Auto-sync effect triggered');
    console.log('🔄 [usePSOsWithPresenceSync] Conditions:', {
      onlineUsersLength: onlineUsers.length,
      psosLoading,
      presenceLoading,
      viewerEmail
    });
    
    // Only check if we have online users and we're not loading
    if (onlineUsers.length > 0 && !psosLoading && !presenceLoading) {
      // Check if any online user is not in our allowedEmails list
      const newUsers = onlineUsers.filter(u => 
        u.role === 'Employee' && 
        u.email.toLowerCase() !== viewerEmail.toLowerCase() &&
        !allowedEmails.has(u.email.toLowerCase())
      );
      
      console.log('🔄 [usePSOsWithPresenceSync] New users check:', {
        totalOnlineUsers: onlineUsers.length,
        newUsersCount: newUsers.length,
        newUsers: newUsers.map(u => ({ email: u.email, role: u.role })),
        allOnlineUsers: onlineUsers.map(u => ({ 
          email: u.email, 
          role: u.role, 
          isEmployee: u.role === 'Employee',
          isNotViewer: u.email.toLowerCase() !== viewerEmail.toLowerCase(),
          isInAllowedEmails: allowedEmails.has(u.email.toLowerCase())
        }))
      });
      
      if (newUsers.length > 0) {
        console.log('🔄 [usePSOsWithPresenceSync] New employees detected, refetching PSOs...', newUsers.map(u => u.email));
        // Refetch PSOs to get updated authorization list
        refetchPsos();
      } else {
        console.log('🔄 [usePSOsWithPresenceSync] No new employees detected');
      }
    } else {
      console.log('🔄 [usePSOsWithPresenceSync] Skipping auto-sync due to conditions');
    }
  }, [onlineUsers.length, psosLoading, presenceLoading, allowedEmails, viewerEmail, refetchPsos]);
  
  // Build filtered PSO list
  const allPsos: PSOWithStatus[] = useMemo(() => {
    console.log('🔄 [usePSOsWithPresenceSync] Building allPsos...');
    console.log('🔄 [usePSOsWithPresenceSync] onlineUsers:', onlineUsers.map(u => ({ email: u.email, role: u.role, status: u.status })));
    console.log('🔄 [usePSOsWithPresenceSync] allowedEmails:', Array.from(allowedEmails));
    console.log('🔄 [usePSOsWithPresenceSync] supMap keys:', Array.from(supMap.keys()));
    
    const decorate = (u: UserStatus): PSOWithStatus => ({
      email: u.email,
      fullName: u.fullName ?? u.name ?? u.email,
      name: u.fullName ?? u.name ?? u.email,
      status: (u.status === 'online' ? 'online' : 'offline') as PSOWithStatus['status'],
      isOnline: u.status === 'online',
      supervisorName: (supMap.get(u.email.toLowerCase()) as string) ?? '—',
    });

    // Solo mostrar PSOs que el supervisor tiene asignados (autorizados)
    // El filtro se basa en allowedEmails que viene de getMyPsos()
    const filteredUsers = onlineUsers.filter(u => 
      u.email.toLowerCase() !== viewerEmail.toLowerCase() &&
      u.role === 'Employee' && // Solo empleados
      allowedEmails.has(u.email.toLowerCase()) // Solo PSOs autorizados para este supervisor
    );

    console.log('🔄 [usePSOsWithPresenceSync] filteredUsers:', filteredUsers.map(u => ({ email: u.email, role: u.role, status: u.status })));

    const result = filteredUsers
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
      
    console.log('🔄 [usePSOsWithPresenceSync] final result:', result.map(p => ({ email: p.email, isOnline: p.isOnline })));
    return result;
  }, [onlineUsers, allowedEmails, supMap, viewerEmail]);
  
  return {
    allPsos,
    loading: psosLoading || presenceLoading,
    error: psosError || presenceError,
    refetchPsos, // Expose refetch function if needed
  };
};
