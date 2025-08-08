import { useContext } from 'react';
import { AuthContext } from './AuthContext';


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
