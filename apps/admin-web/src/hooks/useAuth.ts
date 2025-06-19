import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication state and actions.
 * @returns { account, isLoggedIn, login, logout }
 */
export function useAuth() {
  const { account, login, logout } = useContext(AuthContext);
  return {
    account,
    isLoggedIn: Boolean(account),
    login,
    logout,
  };
}
