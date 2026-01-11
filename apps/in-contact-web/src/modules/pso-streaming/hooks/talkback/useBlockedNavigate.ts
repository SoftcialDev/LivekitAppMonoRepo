/**
 * @fileoverview useBlockedNavigate hook
 * @summary Hook that wraps React Router's useNavigate with talk session blocking
 * @description Provides a navigate function that checks for active talk sessions
 * before allowing navigation, showing a modal if needed
 */

import { useCallback } from 'react';
import { useNavigate as useReactRouterNavigate, useLocation } from 'react-router-dom';
import { useTalkSessionGuardStore } from '../../stores/talk-session-guard-store';
import { logDebug } from '@/shared/utils/logger';
import type { IBlockedNavigate } from './types/useBlockedNavigateTypes';

/**
 * Hook that wraps React Router's useNavigate to block navigation during active talk sessions
 * 
 * @returns Enhanced navigate function that checks for active talk sessions
 */
export function useBlockedNavigate(): IBlockedNavigate {
  const navigate = useReactRouterNavigate();
  const location = useLocation();
  const { hasActiveSessions } = useTalkSessionGuardStore();

  const blockedNavigate: IBlockedNavigate = useCallback(
    (to: string | number, options?: { replace?: boolean; state?: unknown }): void => {
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
        // Use window guard to block navigation and show modal
        const guard = (window as any).__talkNavigationGuard;
        if (guard && guard.checkAndBlockNavigation) {
          const blocked = guard.checkAndBlockNavigation(to);
          if (blocked) {
            logDebug('[useBlockedNavigate] Navigation blocked, modal will be shown', { path: to });
            return; // Navigation blocked, modal shown
          }
        }
      }

      // No active sessions or guard not available, allow navigation
      navigate(to, options);
    },
    [navigate, location.pathname, hasActiveSessions]
  );

  return blockedNavigate;
}

