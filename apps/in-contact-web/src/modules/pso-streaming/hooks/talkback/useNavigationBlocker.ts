/**
 * @fileoverview useNavigationBlocker hook
 * @summary Hook for intercepting React Router navigation during active talk sessions
 * @description Wraps React Router's useNavigate to intercept navigation attempts
 * and show confirmation modal when there are active talk sessions
 */

import { useRef } from 'react';
import { useNavigate as useReactRouterNavigate, useLocation } from 'react-router-dom';
import { useTalkSessionGuardStore } from '../../stores/talk-session-guard-store';
import { logDebug } from '@/shared/utils/logger';
import type {
  IEnhancedNavigate,
  IUseNavigationBlockerReturn,
} from './types/useNavigationBlockerTypes';

/**
 * Hook that wraps React Router's useNavigate to block navigation during active talk sessions
 * 
 * @returns Enhanced navigate function that checks for active talk sessions
 */
export function useNavigationBlocker(): IUseNavigationBlockerReturn {
  const navigate = useReactRouterNavigate();
  const location = useLocation();
  const { hasActiveSessions, stopAllSessions } = useTalkSessionGuardStore();
  
  const blockedRef = useRef(false);
  const pendingPathRef = useRef<string | null>(null);

  /**
   * Enhanced navigate function that checks for active talk sessions
   */
  const enhancedNavigate: IEnhancedNavigate = (
    to: string | number,
    options?: { replace?: boolean; state?: unknown }
  ): void => {
    // If navigating by delta (number), allow it (back/forward)
    if (typeof to === 'number') {
      navigate(to);
      return;
    }

    // If navigating to same path, allow it
    if (to === location.pathname) {
      navigate(to, options);
      return;
    }

    // Check if there are active talk sessions
    if (hasActiveSessions()) {
      // Block navigation and store pending path
      blockedRef.current = true;
      pendingPathRef.current = to;
      
      // Trigger custom event for modal to show
      const event = new CustomEvent('talk-navigation-blocked', {
        detail: { path: to },
      });
      globalThis.dispatchEvent(event);
      
      logDebug('[NavigationBlocker] Blocking navigation due to active talk session', { path: to });
      return;
    }

    // No active sessions, allow navigation
    navigate(to, options);
  };

  /**
   * Handle navigation confirmation (stop sessions and navigate)
   */
  const handleConfirmNavigation = async (): Promise<void> => {
    const pendingPath = pendingPathRef.current;
    if (!pendingPath) {
      return;
    }

    try {
      // Stop all active talk sessions
      logDebug('[NavigationBlocker] Stopping all active talk sessions for navigation');
      await stopAllSessions();
      
      // Clear block state
      blockedRef.current = false;
      const pathToNavigate = pendingPath;
      pendingPathRef.current = null;
      
      // Navigate to pending path
      navigate(pathToNavigate, { replace: false });
      logDebug('[NavigationBlocker] Navigation confirmed, navigating to', { path: pathToNavigate });
    } catch (error) {
      logDebug('[NavigationBlocker] Error stopping sessions, still navigating', { error });
      // Still navigate even if stop fails
      const pathToNavigate = pendingPath;
      blockedRef.current = false;
      pendingPathRef.current = null;
      navigate(pathToNavigate, { replace: false });
    }
  };

  /**
   * Handle navigation cancellation (stay on current page)
   */
  const handleCancelNavigation = (): void => {
    blockedRef.current = false;
    pendingPathRef.current = null;
    logDebug('[NavigationBlocker] Navigation cancelled by user');
  };

  return {
    navigate: enhancedNavigate,
    blocked: blockedRef.current,
    pendingPath: pendingPathRef.current,
    handleConfirmNavigation,
    handleCancelNavigation,
  };
}


