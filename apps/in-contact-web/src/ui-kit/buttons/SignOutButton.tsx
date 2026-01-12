/**
 * @fileoverview SignOutButton - Button component for signing out
 * @summary Button for logging out users
 * @description A styled button component for signing out users.
 * Handles logout, localStorage cleanup, and navigation to login page.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { logError } from '@/shared/utils/logger';
import { SignOutIcon } from '@/ui-kit/icons';

/**
 * SignOutButton component
 * 
 * A button that:
 * - Calls logout from useAuth
 * - Clears all localStorage data
 * - Redirects to login page
 * 
 * @returns A styled button element for signing out
 * 
 * @example
 * ```tsx
 * <SignOutButton />
 * ```
 */
export const SignOutButton: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle click on "Sign Out": performs logout, clears localStorage, then navigates to login page
   */
  const handleSignOut = (): void => {
    try {
      logout();

      // Clear all localStorage data
      localStorage.clear();

      // After logout, redirect to login page
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      logError('Logout failed', { error: err });
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="
        flex items-center space-x-2
        px-8 py-2 border-2 border-(--color-secondary)
        text-(--color-secondary) font-semibold
        rounded-full
        hover:bg-(--color-primary-light) hover:text-white
        transition-colors
      "
    >
      {/* Icon before text */}
      <SignOutIcon className="shrink-0" />

      <span>Sign Out</span>
    </button>
  );
};

