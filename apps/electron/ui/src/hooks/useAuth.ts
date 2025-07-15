import { useContext } from 'react';
import { useMsal } from '@azure/msal-react';
import {
  AccountInfo,
  AuthenticationResult,
  PopupRequest,
  RedirectRequest,
} from '@azure/msal-browser';
import { AuthContext } from '../context/AuthContext';

export interface AuthHook {
  account:     AccountInfo | null;
  initialized: boolean;
  isLoggedIn:  boolean;
  login:       () => Promise<AuthenticationResult>;
  logout:      () => void;
  getApiToken: () => Promise<string>;
  loginPopup:    (request?: PopupRequest) => Promise<AuthenticationResult>;
  loginRedirect: (request?: RedirectRequest) => Promise<void>;
}

/**
 * Custom hook to access authentication context values and MSAL flows.
 *
 * @returns AuthHook
 */
export function useAuth(): AuthHook {
  // Your existing context values
  const { account, initialized, login, logout, getApiToken } =
    useContext(AuthContext);

  // MSAL instance for popup/redirect methods
  const { instance } = useMsal();

  /**
   * Opens a MSAL popup to authenticate the user.
   *
   * @param request Optional MSAL PopupRequest override.
   */
  const loginPopup = (request?: PopupRequest) =>
    instance.loginPopup(request);

  /**
   * Redirects the full window to Azure AD for authentication.
   *
   * @param request Optional MSAL RedirectRequest override.
   */
  const loginRedirect = (request?: RedirectRequest) =>
    instance.loginRedirect(request);

  return {
    account,
    initialized,
    isLoggedIn: Boolean(account),
    login,
    logout,
    getApiToken,
    loginPopup,
    loginRedirect,
  };
}
