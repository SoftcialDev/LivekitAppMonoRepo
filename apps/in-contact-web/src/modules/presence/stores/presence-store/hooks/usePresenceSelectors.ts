/**
 * @fileoverview Presence store selectors
 * @summary Optimized selectors for presence store
 * @description Provides optimized selectors to prevent unnecessary re-renders
 */

import { usePresenceStore } from '../usePresenceStore';
import type { UserStatus } from '../../../types/presenceTypes';

/**
 * Hook to get the status of a specific user
 * 
 * Only re-renders when that specific user's status changes
 * 
 * @param email - User email to check
 * @returns User status or null if not found
 */
export function usePresenceUser(email: string): UserStatus | null {
  return usePresenceStore((state) => {
    // Search in onlineUsers first
    const onlineUser = state.onlineUsers.find((user) => user.email === email);
    if (onlineUser) {
      return onlineUser;
    }

    // If not online, search in offlineUsers
    const offlineUser = state.offlineUsers.find((user) => user.email === email);
    return offlineUser || null;
  });
}

/**
 * Hook to get only online users
 * 
 * Only re-renders when the list of online users changes
 * 
 * @returns Array of online users
 */
export function useOnlineUsers(): UserStatus[] {
  return usePresenceStore((state) => state.onlineUsers);
}

/**
 * Hook to get only offline users
 * 
 * Only re-renders when the list of offline users changes
 * 
 * @returns Array of offline users
 */
export function useOfflineUsers(): UserStatus[] {
  return usePresenceStore((state) => state.offlineUsers);
}

/**
 * Hook to get loading state
 * 
 * Only re-renders when loading state changes
 * 
 * @returns True if loading
 */
export function usePresenceLoading(): boolean {
  return usePresenceStore((state) => state.loading);
}

/**
 * Hook to get error state
 * 
 * Only re-renders when error changes
 * 
 * @returns Error message or null
 */
export function usePresenceError(): string | null {
  return usePresenceStore((state) => state.error);
}

/**
 * Hook to check if a specific user is online
 * 
 * Only re-renders when that user's online status changes
 * 
 * @param email - User email to check
 * @returns True if user is online
 */
export function useIsUserOnline(email: string): boolean {
  return usePresenceStore((state) => {
    return state.onlineUsers.some((user) => user.email === email);
  });
}

