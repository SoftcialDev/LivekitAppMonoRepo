import { PublicClientApplication, Configuration } from '@azure/msal-browser';

// MSAL configuration, sourcing values from Vite env vars (must start with VITE_)
const msalConfig: Configuration = {
  auth: {
    // Your Azure AD App (client) ID
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID,
    // Tenant-specific authority URL
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}`,
    // Redirect URI after login
    redirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI,
  },
  cache: {
    // Persist tokens in localStorage across reloads
    cacheLocation: 'localStorage',
    // Don’t store auth state in cookies
    storeAuthStateInCookie: false,
  },
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
