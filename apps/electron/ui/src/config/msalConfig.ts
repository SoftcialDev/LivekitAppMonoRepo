import { PublicClientApplication, Configuration } from '@azure/msal-browser';

/**
 * MSAL configuration for PublicClientApplication.
 *
 * Chooses the appropriate redirect URI depending on whether the code
 * is running inside Electron (desktop) or in a normal browser (SPA).
 */
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}/v2.0`,
    /**
     * Use desktop redirect URI when running inside Electron,
     * otherwise fall back to the SPA redirect URI.
     */
    redirectUri: (() => {
      const isElectron = navigator.userAgent.toLowerCase().includes('electron');
      return isElectron
        ? import.meta.env.VITE_AZURE_AD_DESKTOP_REDIRECT_URI   // e.g. "myapp://auth"
        : import.meta.env.VITE_AZURE_AD_REDIRECT_URI;          // e.g. "http://localhost:5173"
    })(),
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
