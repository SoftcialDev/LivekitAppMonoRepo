import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  MsalProvider,
  useMsal,
  useIsAuthenticated,
} from '@azure/msal-react';
import { msalInstance } from '../config/msalConfig';
import {
  AuthenticationResult,
  AccountInfo,
  SilentRequest,
  PopupRequest,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

/* ───────────────── helpers ───────────────── */

const isElectron = !!(window as any).process?.versions?.electron;

/** Retorno de login: `void` cuando se emplea redirect, `AuthenticationResult` con popup */
type LoginResult = void | AuthenticationResult;

/* ───────────────── tipos de contexto ───────────────── */

interface AuthContextValue {
  account:      AccountInfo | null;
  initialized:  boolean;
  login:        () => Promise<LoginResult>;
  logout:       () => void;
  getApiToken:  () => Promise<string>;
}

/* ───────────────── contexto ───────────────── */

export const AuthContext = createContext<AuthContextValue>({
  account:     null,
  initialized: false,
  login:       async () => undefined,
  logout:      () => {},
  getApiToken: async () => {
    throw new Error('getApiToken not implemented');
  },
});

/* ───────────────── providers ───────────────── */

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <MsalProvider instance={msalInstance}>
    <InnerAuthProvider>{children}</InnerAuthProvider>
  </MsalProvider>
);

const InnerAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [account,     setAccount]     = useState<AccountInfo | null>(null);
  const [initialized, setInitialized] = useState(false);

  /* ---------- sincronizar MSAL → React ---------- */
  useEffect(() => {
    setAccount(isAuthenticated && accounts.length ? accounts[0] : null);
    setInitialized(true);
  }, [isAuthenticated, accounts]);

  /* ---------- login ---------- */
  const login = async (): Promise<LoginResult> => {
    const req: PopupRequest = {
      scopes: ['openid', 'profile'],
      prompt: 'select_account',
    };

    if (isElectron) {
      // Una sola ventana; MSAL gestionará el hash #code automáticamente
      await instance.loginRedirect(req);
      return; // void
    }

    // Navegador / Vite dev
    return instance.loginPopup(req);
  };

  /* ---------- logout ---------- */
  const logout = (): void => {
    if (isElectron) {
      instance.logoutRedirect({
        postLogoutRedirectUri:
          import.meta.env.VITE_AZURE_AD_REDIRECT_URI as string,
      });
    } else {
      instance.logoutPopup({
        postLogoutRedirectUri:
          import.meta.env.VITE_AZURE_AD_REDIRECT_URI as string,
      });
    }
    setAccount(null);
  };

  /* ---------- token para API ---------- */
  const getApiToken = async (): Promise<string> => {
    if (!account) throw new Error('No signed-in account');

    const apiScope = import.meta.env.VITE_AZURE_AD_API_SCOPE_URI;
    if (!apiScope) {
      throw new Error('VITE_AZURE_AD_API_SCOPE_URI is not defined');
    }

    const silentReq: SilentRequest = { account, scopes: [apiScope] };

    try {
      const res = await instance.acquireTokenSilent(silentReq);
      return res.accessToken;
    } catch (err: unknown) {
      if (
        err instanceof InteractionRequiredAuthError ||

        ['interaction_required', 'consent_required', 'login_required'].includes(
          typeof err === 'object' && err !== null && 'errorCode' in err
            ? (err as { errorCode: string }).errorCode
            : ''
        )
      ) {
        const res = await instance.acquireTokenPopup({
          account,
          scopes: [apiScope],
        });
        return res.accessToken;
      }
      throw err; // otro tipo de error
    }
  };

  return (
    <AuthContext.Provider
      value={{ account, initialized, login, logout, getApiToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
