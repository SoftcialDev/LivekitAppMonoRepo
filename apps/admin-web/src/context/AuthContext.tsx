import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { msalInstance } from '../config/msalConfig';
import type {
  AuthenticationResult,
  AccountInfo,
  SilentRequest,
  PopupRequest,
} from '@azure/msal-browser';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

interface AuthContextValue {
  /**
   * The currently signed-in account, or null if there is no active session.
   */
  account: AccountInfo | null;

  /**
   * True once MSAL has initialized and account state is set.
   */
  initialized: boolean;

  /**
   * Opens a popup to sign in the user with identity scopes.
   * @returns The AuthenticationResult containing id token claims.
   */
  login: () => Promise<AuthenticationResult>;

  /**
   * Logs the user out via a popup and clears the local account state.
   */
  logout: () => void;

  /**
   * Retrieves an access token for your API.
   * Tries silently first, then falls back to a popup if interaction is required.
   * @returns An access token string.
   */
  getApiToken: () => Promise<string>;

  /**
   * Force-refreshes the ID token to pick up any updated roles or claims.
   * @returns The AuthenticationResult with fresh id token claims.
   */
  refreshRoles: () => Promise<AuthenticationResult>;
}

export const AuthContext = createContext<AuthContextValue>({
  account: null,
  initialized: false,
  login: async () => { throw new Error('login not implemented'); },
  logout: () => {},
  getApiToken: async () => { throw new Error('getApiToken not implemented'); },
  refreshRoles: async () => { throw new Error('refreshRoles not implemented'); },
});

/**
 * Wraps the app in MsalProvider and provides authentication context.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <MsalProvider instance={msalInstance}>
    <InnerAuthProvider>{children}</InnerAuthProvider>
  </MsalProvider>
);

/**
 * Manages MSAL account state and exposes login, logout, token acquisition, and role refresh.
 */
const InnerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Update account when MSAL cache changes
    setAccount(isAuthenticated && accounts.length > 0 ? accounts[0] : null);
    setInitialized(true);
  }, [isAuthenticated, accounts]);

  /**
   * login: Opens MSAL login popup requesting identity scopes.
   */
  const login = async (): Promise<AuthenticationResult> => {
    const result = await instance.loginPopup({ scopes: ['openid', 'profile'], prompt: 'select_account' } as PopupRequest);
    setAccount(result.account);
    return result;
  };

  /**
   * logout: Opens MSAL logout popup and clears account state.
   */
const logout = async (): Promise<void> => {
  // fire-and-forget: Azure will sign you out in the popup but won’t redirect anywhere
  instance.logoutPopup({ account });
  // immediately clear local state and go to login page
  setAccount(null);
  window.location.href = '/login';
};


  /**
   * getApiToken: Retrieves an API access token silently or via popup fallback.
   */
  const getApiToken = async (): Promise<string> => {
    if (!account) throw new Error('No signed-in account');
    const apiScope = import.meta.env.VITE_AZURE_AD_API_SCOPE_URI as string;
    if (!apiScope) throw new Error('API scope is not defined');

    try {
      const silentResult = await instance.acquireTokenSilent({ account, scopes: [apiScope], forceRefresh: false } as SilentRequest);
      return silentResult.accessToken;
    } catch (err: any) {
      if (err instanceof InteractionRequiredAuthError || ['interaction_required','consent_required','login_required'].includes(err.errorCode)) {
        const popupResult = await instance.acquireTokenPopup({ account, scopes: [apiScope] } as PopupRequest);
        return popupResult.accessToken;
      }
      throw err;
    }
  };

  /**
   * refreshRoles: Force-refreshes the ID token to update role claims.
   */
  const refreshRoles = async (): Promise<AuthenticationResult> => {
    if (!account) throw new Error('No signed-in account');

    const request: SilentRequest = { account, scopes: ['openid', 'profile'], forceRefresh: true };

    try {
      const result = await instance.acquireTokenSilent(request);
      setAccount(result.account);
      return result;
    } catch (err: any) {
      // Fallback to popup if silent fails
      const popupResult = await instance.acquireTokenPopup({ scopes: ['openid', 'profile'], prompt: 'none' } as PopupRequest);
      setAccount(popupResult.account);
      return popupResult;
    }
  };

  return (
    <AuthContext.Provider value={{ account, initialized, login, logout, getApiToken, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
};
