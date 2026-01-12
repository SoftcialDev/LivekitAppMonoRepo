/**
 * @fileoverview usePresence hook
 * @summary Hook for accessing presence store
 * @description Provides convenient access to presence store state and actions
 */

import { useEffect, useRef } from 'react';
import { usePresenceStore } from '../usePresenceStore';
import { useAuth } from '@/modules/auth';
import { useUserInfo } from '@/modules/auth/stores/user-info-store';
import { logDebug } from '@/shared/utils/logger';

/**
 * Hook for accessing presence store
 * 
 * Automatically initializes presence by:
 * 1. Loading snapshot on mount
 * 2. Connecting to WebSocket when user is authenticated
 * 
 * @returns Presence store state and actions
 * 
 * @example
 * ```typescript
 * const { onlineUsers, offlineUsers, loading, error } = usePresence();
 * ```
 */
export function usePresence() {
  const { account, initialized } = useAuth();
  const { userInfo } = useUserInfo();
  const currentEmailRef = useRef<string | null>(null);
  const accountRef = useRef<typeof account>(account);
  const hasAttemptedLoadRef = useRef<boolean>(false);

  // Keep account ref in sync for cleanup
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  // Use specific selectors to prevent unnecessary re-renders
  // Only re-render when these specific values change
  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const offlineUsers = usePresenceStore((state) => state.offlineUsers);
  const loading = usePresenceStore((state) => state.loading);
  const error = usePresenceStore((state) => state.error);

  // Load snapshot once globally when authentication is ready
  // Wait for auth to be initialized and account to be available before loading
  // This prevents 401 errors on page refresh
  useEffect(() => {
    // Only attempt to load if auth is initialized and we haven't already attempted
    if (!initialized || !account || hasAttemptedLoadRef.current) {
      return;
    }

    // Small delay to ensure token getter is registered by TokenInjector
    // This is better than a fixed delay because it ensures the token system is ready
    const loadDelay = setTimeout(() => {
      hasAttemptedLoadRef.current = true;
      logDebug('usePresence: Initializing presence snapshot (auth ready)', {
        email: account.username,
      });
      // Use getState() to get stable function reference
      // The store will guard against multiple calls internally
      const loadSnapshot = usePresenceStore.getState().loadSnapshot;
      loadSnapshot().catch((err) => {
        logDebug('usePresence: Failed to load presence snapshot', { error: err });
      });
    }, 300); // 300ms delay to ensure token getter is registered

    return () => {
      clearTimeout(loadDelay);
    };
  }, [initialized, account]); // Wait for auth to be ready

  // Connect WebSocket when user is authenticated
  // IMPORTANT: This should NOT disconnect on navigation - WebSocket stays connected in SPA
  useEffect(() => {
    if (!account?.username) {
      // User is not authenticated - don't connect
      // Also don't disconnect here, let the logout handler handle it
      return;
    }

    const email = account.username.toLowerCase();
    const role = userInfo?.role ?? undefined;

    // Only connect if email changed (e.g., user logged in as different user)
    if (currentEmailRef.current === email) {
      return; // Already connected for this email, don't reconnect
    }

    // Store previous email for cleanup
    const previousEmail = currentEmailRef.current;
    currentEmailRef.current = email;

    logDebug('usePresence: Connecting presence WebSocket', { email, role, previousEmail });
    // Use getState() to get stable function references
    const { connectWebSocket, disconnectWebSocket: disconnectFn } = usePresenceStore.getState();
    
    // Only disconnect previous email if it's different (user switched accounts)
    // DO NOT disconnect during navigation - that's why we check previousEmail
    if (previousEmail && previousEmail !== email) {
      logDebug('usePresence: User changed, disconnecting previous', { previousEmail });
      disconnectFn(true); // Mark offline for previous user
    }

    connectWebSocket(email, role ?? undefined).catch((err) => {
      logDebug('usePresence: Failed to connect presence WebSocket', { error: err });
    });

    // Cleanup: Only disconnect if user actually logged out (account becomes null)
    // DO NOT disconnect during navigation - WebSocket should stay connected in SPA
    return () => {
      // In a SPA, this cleanup should NOT run during navigation
      // It only runs when:
      // 1. Component unmounts (rare in SPA, only if layout changes)
      // 2. Email changes (handled above before this cleanup)
      // 3. User logs out (account becomes null)
      //
      // The key: check if account is still valid using the ref (most up-to-date)
      const currentAccount = accountRef.current;
      
      // Only disconnect if account is null (actual logout)
      // DO NOT disconnect if account still exists (navigation or re-render)
      const hasAccount = currentAccount?.username;
      if (hasAccount) {
        // Account still exists - this is just navigation or re-render
        // Keep WebSocket connected for SPA behavior
        logDebug('usePresence: Cleanup - account still valid, keeping WebSocket connected', {
          email,
          accountEmail: currentAccount.username,
        });
      } else {
        logDebug('usePresence: Cleanup - user logged out, disconnecting WebSocket', { 
          email,
        });
        disconnectFn(true); // Mark offline on actual logout
        currentEmailRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.username, userInfo?.role]); // Only depend on email and role

  return {
    onlineUsers,
    offlineUsers,
    loading,
    error,
  };
}

