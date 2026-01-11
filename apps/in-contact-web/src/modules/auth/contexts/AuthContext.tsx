/**
 * @fileoverview AuthContext - React context for authentication state and methods
 * @summary Provides authentication context with MSAL integration
 * @description Wraps the app in MsalProvider and provides authentication context.
 * Manages MSAL account state and exposes login, logout, token acquisition, and role refresh.
 */

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import type {
  AuthenticationResult,
  AccountInfo,
  SilentRequest,
  PopupRequest,
} from '@azure/msal-browser';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../config/msalConfig';
import type { IAuthContextValue } from '../interfaces';
import { config } from '@/shared/config';
import { logError, logDebug } from '@/shared/utils/logger';
import { ConfigurationError } from '@/shared/errors';
import { NotSignedInError } from '../errors';

/**
 * Default context value (will be overridden by provider)
 */
const defaultContextValue: IAuthContextValue = {
  account: null,
  initialized: false,
  login: async () => {
    throw new NotSignedInError();
  },
  logout: () => {},
  getApiToken: async () => {
    throw new NotSignedInError();
  },
  refreshRoles: async () => {
    throw new NotSignedInError();
  },
};

/**
 * Authentication context
 */
export const AuthContext = createContext<IAuthContextValue>(defaultContextValue);

/**
 * Wraps the app in MsalProvider and provides authentication context
 * 
 * @param props.children - React children to wrap
 * @returns JSX element with MSAL provider and auth context
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <MsalProvider instance={msalInstance}>
    <InnerAuthProvider>{children}</InnerAuthProvider>
  </MsalProvider>
);

/**
 * Manages MSAL account state and exposes login, logout, token acquisition, and role refresh
 * 
 * This component is wrapped by MsalProvider and uses MSAL hooks to manage
 * authentication state. It provides methods for:
 * - Login via popup
 * - Logout and redirect
 * - Token acquisition (silent or popup fallback)
 * - Role refresh
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
   * Opens MSAL login popup requesting identity scopes
   * 
   * @returns Promise that resolves to AuthenticationResult
   * @throws Error if login fails
   */
  const login = async (): Promise<AuthenticationResult> => {
    const result = await instance.loginPopup({
      scopes: ['openid', 'profile'],
      prompt: 'select_account',
    } as PopupRequest);
    setAccount(result.account);
    return result;
  };

  /**
   * Opens MSAL logout popup and clears account state
   * 
   * Fire-and-forget: Azure will sign you out in the popup but won't redirect anywhere.
   * Immediately clears local state and redirects to login page.
   */
  const logout = async (): Promise<void> => {
    if (account) {
      // Fire-and-forget: Azure will sign you out in the popup but won't redirect anywhere
      instance.logoutPopup({ account });
    }
    // Immediately clear local state and go to login page
    setAccount(null);
    window.location.href = '/login';
  };

  /**
   * Retrieves an API access token silently or via popup fallback
   * 
   * Tries to acquire token silently first. If interaction is required
   * (e.g., consent needed), falls back to popup.
   * 
   * @returns Promise that resolves to access token string
   * @throws Error if no account is signed in or token acquisition fails
   */
  const getApiToken = async (): Promise<string> => {
    if (!account) {
      throw new NotSignedInError();
    }

    const apiScope = config.azureAdApiScopeUri;
    if (!apiScope) {
      throw new ConfigurationError(
        'API scope is not defined. Please configure VITE_AZURE_AD_API_SCOPE_URI environment variable.'
      );
    }

    try {
      const silentResult = await instance.acquireTokenSilent({
        account,
        scopes: [apiScope],
        forceRefresh: false,
      } as SilentRequest);
      return silentResult.accessToken;
    } catch (err: unknown) {
      if (
        err instanceof InteractionRequiredAuthError ||
        (err as { errorCode?: string }).errorCode === 'interaction_required' ||
        (err as { errorCode?: string }).errorCode === 'consent_required' ||
        (err as { errorCode?: string }).errorCode === 'login_required'
      ) {
        const popupResult = await instance.acquireTokenPopup({
          account,
          scopes: [apiScope],
        } as PopupRequest);
        return popupResult.accessToken;
      }
      logError('Failed to acquire API token', { error: err });
      throw err;
    }
  };

  /**
   * Force-refreshes the ID token to update role claims
   * 
   * Useful when user roles might have changed in Azure AD.
   * Tries silent refresh first, falls back to popup if needed.
   * 
   * @returns Promise that resolves to AuthenticationResult with fresh token
   * @throws Error if no account is signed in or refresh fails
   */
  const refreshRoles = async (): Promise<AuthenticationResult> => {
    if (!account) {
      throw new NotSignedInError();
    }

    const request: SilentRequest = {
      account,
      scopes: ['openid', 'profile'],
      forceRefresh: true,
    };

    try {
      const result = await instance.acquireTokenSilent(request);
      setAccount(result.account);
      return result;
    } catch (err: unknown) {
      // Fallback to popup if silent fails
      logDebug('Silent token refresh failed, using popup', { error: err });
      const popupResult = await instance.acquireTokenPopup({
        scopes: ['openid', 'profile'],
        prompt: 'none',
      } as PopupRequest);
      setAccount(popupResult.account);
      return popupResult;
    }
  };

  return (
    <AuthContext.Provider
      value={{ account, initialized, login, logout, getApiToken, refreshRoles }}
    >
      {children}
    </AuthContext.Provider>
  );
};

