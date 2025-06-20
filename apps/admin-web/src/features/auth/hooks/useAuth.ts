import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';

/**
 * Custom hook to access authentication context values and actions.
 *
 * @returns {{
 *   account: AccountInfo | null,
 *   initialized: boolean,
 *   isLoggedIn: boolean,
 *   login: () => Promise<AuthenticationResult>,
 *   logout: () => void,
 *   acquireTokenSilent: (scopes: string[]) => Promise<AuthenticationResult>
 * }}
 * - account: The signed-in account information from MSAL cache, or null if not signed in.
 * - initialized: True once MSAL has finished checking local cache for an existing session.
 * - isLoggedIn: True when account is non-null.
 * - login: Function to trigger MSAL login popup. Returns a Promise resolving to AuthenticationResult.
 * - logout: Function to trigger MSAL logout popup and clear session.
 * - acquireTokenSilent: Function to request tokens silently for given scopes using the cached account.
 */
export function useAuth() {
  const { account, initialized, login, logout, acquireTokenSilent } = useContext(AuthContext);

  return {
    account,
    initialized,
    isLoggedIn: Boolean(account),
    login,
    logout,
    acquireTokenSilent,
  };
}
