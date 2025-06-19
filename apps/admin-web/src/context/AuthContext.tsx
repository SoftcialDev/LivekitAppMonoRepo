import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { msalInstance } from '../config/msalConfig';
import type { AuthenticationResult } from '@azure/msal-browser';

interface AuthContextValue {
  account: AuthenticationResult | null;
  login: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  account: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <MsalProvider instance={msalInstance}>
    <InnerAuthProvider>{children}</InnerAuthProvider>
  </MsalProvider>
);

const InnerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [account, setAccount] = useState<AuthenticationResult | null>(null);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      // accounts[0] contains ID token info; you could also acquireTokenSilent here
      setAccount(accounts[0] as any);
    }
  }, [isAuthenticated, accounts]);

  const login = async () => {
    await instance.loginPopup({
      scopes: [
        'User.Read', // Microsoft Graph scope
         import.meta.env.VITE_AZURE_AD_API_SCOPE_URI,
      ],
      prompt: 'select_account',
    });
  };

  const logout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI,
    });
    setAccount(null);
  };

  return (
    <AuthContext.Provider value={{ account, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
