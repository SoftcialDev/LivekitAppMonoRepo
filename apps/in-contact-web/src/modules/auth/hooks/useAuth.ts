/**
 * @fileoverview useAuth - Hook for accessing authentication context
 * @summary Custom hook to access authentication context values and actions
 * @description Provides access to authentication state and methods via context
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { IAuthContextValue } from '../interfaces';
import { ContextError } from '@/shared/errors';

/**
 * Custom hook to access authentication context values and actions
 * 
 * @returns Authentication context value with account, initialized state, and methods
 * @throws {ContextError} if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * const { account, initialized, login, logout, getApiToken } = useAuth();
 * 
 * if (!initialized) {
 *   return <Loading />;
 * }
 * 
 * if (!account) {
 *   return <LoginButton onClick={login} />;
 * }
 * ```
 */
export function useAuth(): IAuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new ContextError(
      'useAuth must be used within an AuthProvider. ' +
        'Make sure to wrap your component tree with AuthProvider.'
    );
  }

  return {
    account: context.account,
    initialized: context.initialized,
    isLoggedIn: Boolean(context.account),
    login: context.login,
    logout: context.logout,
    getApiToken: context.getApiToken,
    refreshRoles: context.refreshRoles,
  };
}

