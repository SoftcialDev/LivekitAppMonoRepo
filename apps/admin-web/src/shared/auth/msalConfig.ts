import { PublicClientApplication, Configuration } from '@azure/msal-browser';

/**
 * MSAL configuration for PublicClientApplication.
 *
 * This object configures authentication and cache behavior for MSAL in a SPA.
 *
 * Environment variables (via Vite) must be defined as:
 * - VITE_AZURE_AD_CLIENT_ID: the Azure AD App (client) ID (GUID)..
 * - VITE_AZURE_AD_TENANT_ID: the Azure AD Tenant ID (GUID).
 * - VITE_AZURE_AD_REDIRECT_URI: the exact redirect URI registered in Azure AD (including protocol, host, port, and path if applicable).
 *
 * @type {Configuration}
 */
const msalConfig: Configuration = {
  auth: {
    /**
     * The Client (Application) ID of your Azure AD App Registration.
     * MSAL uses this value to identify which application is requesting tokens.
     */
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID,

    /**
     * The authority URL for authenticating users.
     * Should point to your tenant in Azure AD.
     * Format: 'https://login.microsoftonline.com/{tenantId}'.
     */
     authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}/v2.0`,

    /**
     * The URI where Azure AD will redirect the browser after sign-in.
     * Must exactly match one of the redirect URIs registered under
     * "Single-page application" in Azure AD App Registration.
     * Example: 'http://localhost:5173' or 'https://yourapp.com/auth/callback'.
     */
    redirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI,
  },
  cache: {
    /**
     * Determines where MSAL stores its cache (tokens, account info).
     * 'localStorage' persists across tabs and page reloads.
     * Alternatively, use 'sessionStorage' to clear on tab close.
     */
    cacheLocation: 'localStorage',

    /**
     * If true, MSAL stores auth state in cookies as well, to support
     * older browsers or certain storage-restricted environments (e.g., IE11).
     * Default is false; set true only if needed.
     */
    storeAuthStateInCookie: false,
  },
};

/**
 * Singleton MSAL PublicClientApplication instance.
 *
 * Uses the `msalConfig` above. Import and pass this instance
 * to MsalProvider in your React app so that useMsal/useIsAuthenticated hooks work.
 *
 * Example:
 *   import { MsalProvider } from '@azure/msal-react';
 *   import { msalInstance } from './config/msalConfig';
 *
 *   <MsalProvider instance={msalInstance}>
 *     <App />
 *   </MsalProvider>
 *
 * @type {PublicClientApplication}
 */
export const msalInstance = new PublicClientApplication(msalConfig);
