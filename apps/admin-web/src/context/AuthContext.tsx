import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { msalInstance } from '../config/msalConfig';
import type {
  AuthenticationResult,
  AccountInfo,
  SilentRequest
} from '@azure/msal-browser';

interface AuthContextValue {
  /**
   * Signed-in account information from MSAL cache.
   * Null when there is no authenticated session.
   */
  account: AccountInfo | null;

  /**
   * Indicates that MSAL has completed checking local cache for an existing session.
   * False until MSAL reports its initial session state.
   */
  initialized: boolean;

  /**
   * Triggers MSAL popup login flow.
   * @returns Promise resolving to AuthenticationResult after successful login.
   * @throws Error if login fails.
   */
  login: () => Promise<AuthenticationResult>;

  /**
   * Triggers MSAL logout popup flow and clears local account state.
   */
  logout: () => void;

  /**
   * Acquires a token silently for the given scopes using the cached account.
   * @param scopes Array of scopes for which to request a token.
   * @returns Promise resolving to AuthenticationResult containing the token.
   * @throws Error if there is no signed-in account or token acquisition fails.
   */
  acquireTokenSilent: (scopes: string[]) => Promise<AuthenticationResult>;
}

export const AuthContext = createContext<AuthContextValue>({
  account: null,
  initialized: false,
  login: async () => { throw new Error('login not implemented'); },
  logout: () => { /* no-op */ },
  acquireTokenSilent: async () => { throw new Error('acquireTokenSilent not implemented'); },
});

/**
 * AuthProvider component.
 * Wraps children with MSAL provider and internal authentication context.
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
 * @param props.children ReactNode children to render when context is available.
 */
const InnerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('[AuthContext] isAuthenticated:', isAuthenticated, 'accounts:', accounts);
    if (isAuthenticated && accounts.length > 0) {
      console.log('[AuthContext] restoring account from MSAL cache:', accounts[0]);
      setAccount(accounts[0]);
    } else {
      console.log('[AuthContext] no account in cache; clearing state');
      setAccount(null);
    }
    setInitialized(true);
  }, [isAuthenticated, accounts]);

  /**
   * login: Opens MSAL login popup with required scopes.
   * @returns AuthenticationResult containing idTokenClaims and tokens.
   */
  const login = async (): Promise<AuthenticationResult> => {
    const result = await instance.loginPopup({
      scopes: [
        'User.Read',
        import.meta.env.VITE_AZURE_AD_API_SCOPE_URI
      ],
      prompt: 'select_account',
    });
    return result;
  };

  /**
   * logout: Opens MSAL logout popup and clears the local account state.
   */
  const logout = (): void => {
    instance.logoutPopup({
      postLogoutRedirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI,
    });
    setAccount(null);
  };

  /**
   * acquireTokenSilent: Requests a token silently for specified scopes using the cached account.
   * @param scopes Array of scopes to request.
   * @returns AuthenticationResult with the requested token.
   * @throws Error if there is no signed-in account.
   */
  const acquireTokenSilent = async (scopes: string[]): Promise<AuthenticationResult> => {
    if (!account) {
      throw new Error('No signed-in account');
    }
    const silentRequest: SilentRequest = {
      account,
      scopes,
      forceRefresh: false,
    };
    const result = await instance.acquireTokenSilent(silentRequest);
    return result;
  };

  return (
    <AuthContext.Provider value={{ account, initialized, login, logout, acquireTokenSilent }}>
      {children}
    </AuthContext.Provider>
  );
};
