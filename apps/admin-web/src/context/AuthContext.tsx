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
   * Signed-in account information from MSAL cache.
   * Null when there is no authenticated session.
   */
  account: AccountInfo | null;

  /**
   * Indicates that MSAL has completed checking local cache for an existing session.
   */
  initialized: boolean;

  /**
   * Triggers MSAL popup login flow requesting only identity scopes.
   * @returns Promise resolving to AuthenticationResult after successful login.
   * @throws Error if login fails.
   */
  login: () => Promise<AuthenticationResult>;

  /**
   * Triggers MSAL logout popup flow and clears local account state.
   */
  logout: () => void;

  /**
   * Acquires an access token for the backend API.
   * Uses silent-first, falls back to popup if interaction required.
   *
   * Environment variable VITE_AZURE_AD_API_SCOPE_URI must be set to the full scope,
   * e.g. "api://<API_CLIENT_ID>/access_as_user".
   *
   * @returns Promise resolving to the access token string.
   * @throws Error if there is no signed-in account or token acquisition fails irrecoverably.
   */
  getApiToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue>({
  account: null,
  initialized: false,
  login: async () => { throw new Error('login not implemented'); },
  logout: () => { /* no-op */ },
  getApiToken: async () => { throw new Error('getApiToken not implemented'); },
});

/**
 * AuthProvider component.
 * Wraps children with MSAL provider and internal authentication context.
 *
 * @param props.children ReactNode children to render under authentication context.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <MsalProvider instance={msalInstance}>
    <InnerAuthProvider>{children}</InnerAuthProvider>
  </MsalProvider>
);

/**
 * InnerAuthProvider component.
 * Manages authentication state based on MSAL hooks and provides context values.
 *
 * @param props.children ReactNode children to render when context is available.
 */
const InnerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // After MSAL checks cache, set account state
    if (isAuthenticated && accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      setAccount(null);
    }
    setInitialized(true);
  }, [isAuthenticated, accounts]);

  /**
   * login: Opens MSAL login popup requesting only identity scopes.
   * Do not include API scope here; request API scope later via getApiToken().
   *
   * @returns AuthenticationResult containing idTokenClaims.
   * @throws Error if login fails.
   */
  const login = async (): Promise<AuthenticationResult> => {
    const loginRequest: PopupRequest = {
      scopes: ['openid', 'profile'],
      prompt: 'select_account',
    };
    const result = await instance.loginPopup(loginRequest);
    return result;
  };

  /**
   * logout: Opens MSAL logout popup and clears the local account state.
   */
  const logout = (): void => {
    instance.logoutPopup({
      postLogoutRedirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI as string,
    });
    setAccount(null);
  };

  /**
   * getApiToken: Acquires an access token for the backend API.
   * First tries silent acquisition; if interaction required, falls back to popup.
   *
   * @returns Access token string.
   * @throws Error if no signed-in account or VITE_AZURE_AD_API_SCOPE_URI not defined or acquisition fails.
   */
  const getApiToken = async (): Promise<string> => {
    if (!account) {
      throw new Error('No signed-in account');
    }
    const apiScope = import.meta.env.VITE_AZURE_AD_API_SCOPE_URI as string;
    if (!apiScope) {
      throw new Error('VITE_AZURE_AD_API_SCOPE_URI is not defined');
    }
    const silentRequest: SilentRequest = {
      account,
      scopes: [apiScope],
      forceRefresh: false,
    };
    try {
      const silentResult = await instance.acquireTokenSilent(silentRequest);
      console.log("acaaa",apiScope)
      console.log(silentResult)
      return silentResult.accessToken;
    } catch (err: any) {
      // If interaction is required, fallback to popup
      if (
        err instanceof InteractionRequiredAuthError ||
        err.errorCode === 'interaction_required' ||
        err.errorCode === 'consent_required' ||
        err.errorCode === 'login_required'
      ) {
        const popupRequest: PopupRequest = {
          account,
          scopes: [apiScope],
        };
        const popupResult = await instance.acquireTokenPopup(popupRequest);
        return popupResult.accessToken;
      }
      // Other errors: propagate
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ account, initialized, login, logout, getApiToken }}>
      {children}
    </AuthContext.Provider>
  );
};
