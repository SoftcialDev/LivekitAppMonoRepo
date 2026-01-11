/**
 * @fileoverview useUserInfo - Hook for accessing user information store
 * @summary Hook for accessing user information state and methods
 * @description Hook that provides access to user information state and methods.
 * Automatically initializes the store from localStorage on mount (only once).
 * Uses shallow equality to avoid unnecessary re-renders when state values haven't changed.
 */

import { useEffect, useRef, useMemo } from 'react';
import { useUserInfoStore } from '../useUserInfoStore';
import type { UserInfo } from '../../../types';

/**
 * Return type for useUserInfo hook
 * 
 * Provides user information state (userInfo and isLoading only).
 * Functions should be accessed via useUserInfoStore.getState().
 */
export interface IUseUserInfoReturn {
  /**
   * User information from the database, or null if not loaded
   */
  userInfo: UserInfo | null;

  /**
   * True if user info is currently being loaded
   */
  isLoading: boolean;
}

/**
 * Hook for accessing user information store
 * 
 * Provides access to user information state and methods.
 * Automatically initializes the store from localStorage on mount (only once).
 * Uses shallow equality to prevent re-renders when object references change but values are the same.
 * 
 * @returns User information store state (userInfo and isLoading only)
 * 
 * @example
 * ```tsx
 * const { userInfo, isLoading } = useUserInfo();
 * 
 * useEffect(() => {
 *   if (!userInfo && !isLoading) {
 *     const loadUserInfo = useUserInfoStore.getState().loadUserInfo;
 *     loadUserInfo();
 *   }
 * }, [userInfo, isLoading]);
 * ```
 */
export function useUserInfo(): IUseUserInfoReturn {
  const hasInitializedRef = useRef<boolean>(false);

  // Initialize from localStorage on mount (only once)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initialize = useUserInfoStore.getState().initialize;
      initialize();
    }
  }, []);

  // Use memoized selector to prevent re-renders when object reference changes but values are the same
  // Only return state values, not functions (use getState() for functions)
  // Select values individually and memoize to prevent unnecessary re-renders
  const userInfo = useUserInfoStore((state) => state.userInfo);
  const isLoading = useUserInfoStore((state) => state.isLoading);

  // Return memoized object to prevent reference changes
  return useMemo(
    () => ({
      userInfo,
      isLoading,
    }),
    [userInfo, isLoading]
  );
}

