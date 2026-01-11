/**
 * @fileoverview TalkNavigationGuard component
 * @summary Component for intercepting React Router navigation during active talk sessions
 * @description Wraps components and intercepts navigation attempts via link clicks
 * and programmatic navigation when there are active talk sessions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTalkSessionGuardStore } from '../stores/talk-session-guard-store';
import { TalkNavigationModal } from './TalkNavigationModal';
import { logDebug } from '@/shared/utils/logger';

/**
 * TalkNavigationGuard component
 * 
 * Intercepts navigation attempts when there are active talk sessions
 * and shows a confirmation modal before allowing navigation.
 * 
 * This component should be placed at the page level where navigation
 * blocking is needed.
 */
export const TalkNavigationGuard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasActiveSessions, stopAllSessions } = useTalkSessionGuardStore();
  
  const [showModal, setShowModal] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);
  const navigateRef = useRef(navigate);

  // Keep navigate ref up to date
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  /**
   * Intercept link clicks to block navigation during active talk sessions
   */
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) {
        // External link or non-navigation link
        return;
      }

      // Check if there are active talk sessions
      if (hasActiveSessions() && href !== location.pathname) {
        // Block navigation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Store pending navigation and show modal
        pendingNavigationRef.current = href;
        setShowModal(true);
        logDebug('[TalkNavigationGuard] Blocking navigation due to active talk session', { href });
      }
    };

    // Listen for link clicks in capture phase (before React Router)
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasActiveSessions, location.pathname]);

  /**
   * Expose function to check and block navigation programmatically
   * This can be called from components that need to check before navigating
   */
  useEffect(() => {
    (window as any).__talkNavigationGuard = {
      checkAndBlockNavigation: (targetPath: string): boolean => {
        if (!hasActiveSessions() || targetPath === location.pathname) {
          return false; // Don't block
        }

        // Block navigation and show modal
        pendingNavigationRef.current = targetPath;
        setShowModal(true);
        logDebug('[TalkNavigationGuard] Blocking programmatic navigation', { targetPath });
        return true; // Blocked
      },
      hasActiveSessions: () => hasActiveSessions(),
    };

    return () => {
      delete (window as any).__talkNavigationGuard;
    };
  }, [hasActiveSessions, location.pathname]);

  /**
   * Handle navigation confirmation
   * Stops all active talk sessions and navigates to pending route
   */
  const handleConfirm = useCallback(async (): Promise<void> => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    const pendingPath = pendingNavigationRef.current;
    setShowModal(false);

    try {
      // Stop all active talk sessions
      logDebug('[TalkNavigationGuard] Stopping all active talk sessions for navigation');
      await stopAllSessions();
      
      // Navigate to pending route if exists
      if (pendingPath && pendingPath.startsWith('/')) {
        logDebug('[TalkNavigationGuard] Navigating to pending route', { path: pendingPath });
        navigateRef.current(pendingPath, { replace: false });
      }
    } catch (error) {
      logDebug('[TalkNavigationGuard] Error stopping sessions, still navigating', { error });
      // Still navigate even if stop fails
      if (pendingPath && pendingPath.startsWith('/')) {
        navigateRef.current(pendingPath, { replace: false });
      }
    } finally {
      pendingNavigationRef.current = null;
      isNavigatingRef.current = false;
    }
  }, [stopAllSessions]);

  /**
   * Handle navigation cancellation
   * User wants to stay on current page
   */
  const handleCancel = useCallback((): void => {
    setShowModal(false);
    pendingNavigationRef.current = null;
    logDebug('[TalkNavigationGuard] Navigation cancelled by user');
  }, []);

  return (
    <TalkNavigationModal
      open={showModal}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

