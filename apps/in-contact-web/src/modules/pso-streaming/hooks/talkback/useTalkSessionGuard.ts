/**
 * @fileoverview useTalkSessionGuard hook
 * @summary Hook for blocking navigation during active talk sessions
 * @description Prevents navigation when there are active talk sessions by using
 * browser beforeunload events. Provides utilities to check and handle navigation
 * blocking. The modal should be shown when navigation is attempted.
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTalkSessionGuardStore } from '../../stores/talk-session-guard-store';
import { logDebug, logWarn } from '@/shared/utils/logger';
import { createNavigationClickHandler } from '@/shared/utils/navigationUtils';
import type {
  IUseTalkSessionGuardOptions,
  IUseTalkSessionGuardReturn,
} from './types/useTalkSessionGuardTypes';

/**
 * Hook that blocks navigation during active talk sessions
 * 
 * Uses browser beforeunload and React Router navigation interception
 * to prevent navigation when there are active talk sessions.
 * 
 * @param options - Configuration options
 * @returns Object with modal state and handlers
 */
/**
 * Hook that provides navigation blocking utilities for active talk sessions
 * 
 * This hook:
 * 1. Blocks browser refresh/close via beforeunload
 * 2. Provides utilities to check and handle navigation blocking
 * 3. The actual navigation interception should be handled at the component level
 * 
 * @param options - Configuration options
 * @returns Object with modal state and handlers
 */
export function useTalkSessionGuard(
  options: IUseTalkSessionGuardOptions = {}
): IUseTalkSessionGuardReturn {
  const { enabled = true } = options;
  const location = useLocation();
  const { hasActiveSessions, stopAllSessions } = useTalkSessionGuardStore();
  
  const [showModal, setShowModal] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);

  /**
   * Handle browser beforeunload event (refresh, close tab, etc.)
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (hasActiveSessions()) {
        // Show browser's default confirmation dialog
        e.preventDefault();
        e.preventDefault(); // Modern way to prevent navigation
        logDebug('[TalkSessionGuard] Blocking page unload due to active talk session');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasActiveSessions]);

  /**
   * Intercept navigation attempts via link clicks and programmatic navigation
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    /**
     * Handle link clicks to intercept navigation
     */
    const handleClick = createNavigationClickHandler({
      hasActiveSessions,
      currentPathname: location.pathname,
      onBlockNavigation: (href: string) => {
        pendingNavigationRef.current = href;
        setShowModal(true);
      },
      logPrefix: 'TalkSessionGuard',
    });

    /**
     * Handle popstate events (back/forward button)
     */
    const handlePopState = (e: PopStateEvent): void => {
      if (hasActiveSessions() && globalThis.location.pathname !== location.pathname) {
        // Block navigation by pushing current state back
        e.preventDefault();
        globalThis.history.pushState(null, '', location.pathname);
        pendingNavigationRef.current = globalThis.location.pathname;
        setShowModal(true);
        logDebug('[TalkSessionGuard] Blocking popstate navigation due to active talk session');
      }
    };

    // Listen for link clicks in capture phase (before React Router)
    document.addEventListener('click', handleClick, true);
    globalThis.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      globalThis.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, hasActiveSessions, location.pathname]);

  /**
   * Expose a function to check if navigation should be blocked
   * This can be called programmatically when navigation is attempted
   */
  const checkAndBlockNavigation = (targetPath: string): boolean => {
    if (!enabled || !hasActiveSessions()) {
      return false; // Don't block
    }

    if (targetPath === location.pathname) {
      return false; // Same path, don't block
    }

    // Store pending navigation and show modal
    pendingNavigationRef.current = targetPath;
    setShowModal(true);
    logDebug('[TalkSessionGuard] Blocking navigation due to active talk session', { targetPath });
    return true; // Block navigation
  };

  /**
   * Handle navigation confirmation
   * Stops all active talk sessions
   * The actual navigation should be handled by the calling component
   */
  const handleConfirm = async (): Promise<void> => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    setShowModal(false);

    try {
      // Stop all active talk sessions
      logDebug('[TalkSessionGuard] Stopping all active talk sessions for navigation');
      await stopAllSessions();
      
      // Return the pending URL so calling component can navigate
      // The pending URL is stored in pendingNavigationRef.current
    } catch (error) {
      logWarn('[TalkSessionGuard] Error stopping sessions before navigation', { error });
    } finally {
      isNavigatingRef.current = false;
    }
  };

  /**
   * Get the pending navigation path
   */
  const getPendingNavigation = (): string | null => {
    return pendingNavigationRef.current;
  };

  /**
   * Handle navigation cancellation
   * User wants to stay on current page
   */
  const handleCancel = (): void => {
    setShowModal(false);
    pendingNavigationRef.current = null;
    logDebug('[TalkSessionGuard] Navigation cancelled by user');
  };

  return {
    showModal,
    handleConfirm,
    handleCancel,
    getPendingNavigation,
    checkAndBlockNavigation,
  };
}

