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
 *   getApiToken: () => Promise<string>
 * }}
 */
export function useAuth() {
  const { account, initialized, login, logout, getApiToken } = useContext(AuthContext);

  return {
    account,
    initialized,
    isLoggedIn: Boolean(account),
    login,
    logout,
    getApiToken, 
  };
}
