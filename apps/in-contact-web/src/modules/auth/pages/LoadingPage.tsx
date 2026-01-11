/**
 * @fileoverview LoadingPage - Page that loads user information after login
 * @summary Shows loading spinner while fetching user information from database
 * @description Handles the loading of user information after successful Azure AD login.
 * Uses retry logic to automatically retry failed requests up to 1 minute (4 attempts).
 * Redirects based on user role once user info is loaded successfully.
 * Shows error modal if all retry attempts fail.
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRetryUserInfo } from '../hooks/useRetryUserInfo';
import { useUserInfo } from '../stores';
import { Loading } from '@/ui-kit/feedback';
import { ConfirmModal } from '@/ui-kit/modals';
import { logDebug } from '@/shared/utils/logger';
import { UserRole } from '../enums';

/**
 * LoadingPage component
 * 
 * Handles the loading of user information after successful Azure AD login.
 * 
 * Flow:
 * 1. When account is authenticated, triggers user info loading with retry logic (only once)
 * 2. Retry logic automatically retries failed requests every 15 seconds
 *    up to 4 attempts (1 minute total)
 * 3. If loading succeeds, redirects based on user role:
 *    - PSO role → /psosDashboard
 *    - ContactManager role → /contactManagerDashboard
 *    - Admin, Supervisor, SuperAdmin → /psos-streaming
 * 4. If all retry attempts fail, shows error modal with option to return to login
 * 
 * @returns Loading spinner component or error modal
 * 
 * @example
 * ```tsx
 * // Route configuration
 * <Route path="/loading" element={<LoadingPage />} />
 * ```
 */
export const LoadingPage: React.FC = (): JSX.Element => {
  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const {
    hasFailed,
    retryLoadUserInfo,
    reset,
  } = useRetryUserInfo();
  const navigate = useNavigate();

  // Use refs to track state and prevent multiple calls/navigations
  const hasTriggeredRef = useRef<boolean>(false);
  const accountIdRef = useRef<string | null>(null);
  const hasNavigatedRef = useRef<boolean>(false);

  /**
   * Handles navigation back to login page
   * Resets retry state before navigating
   */
  const handleBackToLogin = (): void => {
    reset();
    hasTriggeredRef.current = false;
    accountIdRef.current = null;
    hasNavigatedRef.current = false;
    navigate('/login', { replace: true });
  };

  // Effect 1: Load user info when account is available
  useEffect(() => {
    // If account is not available, redirect to login
    if (!account) {
      logDebug('LoadingPage: No account available, redirecting to login');
      hasTriggeredRef.current = false;
      accountIdRef.current = null;
      hasNavigatedRef.current = false;
      navigate('/login', { replace: true });
      return;
    }

    // Don't trigger if already failed or if already navigated
    if (hasFailed || hasNavigatedRef.current) {
      return;
    }

    // Don't trigger if userInfo is already loaded (will be handled by redirect effect)
    if (userInfo) {
      return;
    }

    // Only trigger once per account
    const currentAccountId = account.localAccountId;
    if (!hasTriggeredRef.current || accountIdRef.current !== currentAccountId) {
      hasTriggeredRef.current = true;
      accountIdRef.current = currentAccountId;
      logDebug('LoadingPage: Starting user info load', { accountId: currentAccountId });
      
      retryLoadUserInfo().catch(() => {
        // Error handling is done by the hook (sets hasFailed)
        // This catch prevents unhandled promise rejection warnings
        logDebug('LoadingPage: user info loading failed after all retries');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, navigate, hasFailed]); // Exclude userInfo to prevent re-triggering

  // Effect 2: Redirect once user info is loaded (only once)
  useEffect(() => {
    // Prevent multiple navigations
    if (!userInfo || hasNavigatedRef.current) {
      return;
    }

    // Mark as navigated immediately to prevent multiple navigations
    hasNavigatedRef.current = true;
    
    logDebug('LoadingPage: detected role from database', { role: userInfo.role });

    // Redirect based on user role
    if (userInfo.role === UserRole.PSO) {
      navigate('/psosDashboard', { replace: true });
    } else if (userInfo.role === UserRole.ContactManager) {
      navigate('/contactManagerDashboard', { replace: true });
    } else if (
      userInfo.role === UserRole.Admin ||
      userInfo.role === UserRole.Supervisor ||
      userInfo.role === UserRole.SuperAdmin
    ) {
      navigate('/psos-streaming', { replace: true });
    } else {
      // Unknown role -> redirect to login
      navigate('/login', { replace: true });
    }
  }, [userInfo, navigate]);

  // Show error modal if all retry attempts failed
  if (hasFailed) {
    return (
      <>
        <Loading
          action="is loading your user information"
          bgClassName="bg-[var(--color-primary)]"
        />
        <ConfirmModal
          open={hasFailed}
          title="Unable to Start Session"
          message="There was a problem starting your session. Please try again or contact support if the problem persists."
          onClose={handleBackToLogin}
          onConfirm={handleBackToLogin}
          confirmLabel="Back to Login"
          cancelLabel=""
          className="w-fit"
        />
      </>
    );
  }

  // Show loading spinner while retrying or waiting for user info
  return (
    <Loading
      action="is loading your user information"
      bgClassName="bg-[var(--color-primary)]"
    />
  );
};
