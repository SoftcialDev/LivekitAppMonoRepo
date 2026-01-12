/**
 * @fileoverview MSAL configuration for Azure AD authentication
 * @summary Configures MSAL PublicClientApplication instance
 * @description MSAL configuration for PublicClientApplication. This object configures
 * authentication and cache behavior for MSAL in a SPA.
 * 
 * Environment variables (via Vite) must be defined as:
 * - VITE_AZURE_AD_CLIENT_ID: the Azure AD App (client) ID (GUID)
 * - VITE_AZURE_AD_TENANT_ID: the Azure AD Tenant ID (GUID)
 * - VITE_AZURE_AD_REDIRECT_URI: the exact redirect URI registered in Azure AD
 * - VITE_AZURE_AD_API_SCOPE_URI: the API scope URI for token acquisition
 */

import { PublicClientApplication, type Configuration } from '@azure/msal-browser';
import { config } from '@/shared/config';
import { ConfigurationError } from '@/shared/errors';

/**
 * Validates Azure AD configuration
 * 
 * @throws {ConfigurationError} if required Azure AD environment variables are missing
 */
function validateAzureAdConfig(): void {
  if (!config.azureAdClientId) {
    throw new ConfigurationError(
      'VITE_AZURE_AD_CLIENT_ID is required for authentication. ' +
        'Please set it in your .env file.'
    );
  }

  if (!config.azureAdTenantId) {
    throw new ConfigurationError(
      'VITE_AZURE_AD_TENANT_ID is required for authentication. ' +
        'Please set it in your .env file.'
    );
  }

  if (!config.azureAdRedirectUri) {
    throw new ConfigurationError(
      'VITE_AZURE_AD_REDIRECT_URI is required for authentication. ' +
        'Please set it in your .env file.'
    );
  }
}

/**
 * MSAL configuration object
 * 
 * @throws {ConfigurationError} if required environment variables are missing
 */
const msalConfig: Configuration = {
  auth: {
    /**
     * The Client (Application) ID of your Azure AD App Registration.
     * MSAL uses this value to identify which application is requesting tokens.
     */
    clientId: config.azureAdClientId!,

    /**
     * The authority URL for authenticating users.
     * Should point to your tenant in Azure AD.
     * Format: 'https://login.microsoftonline.com/{tenantId}/v2.0'
     */
    authority: `https://login.microsoftonline.com/${config.azureAdTenantId!}/v2.0`,

    /**
     * The URI where Azure AD will redirect the browser after sign-in.
     * Must exactly match one of the redirect URIs registered under
     * "Single-page application" in Azure AD App Registration.
     */
    redirectUri: config.azureAdRedirectUri!,
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
 * Singleton MSAL PublicClientApplication instance
 * 
 * Uses the `msalConfig` above. Import and pass this instance
 * to MsalProvider in your React app so that useMsal/useIsAuthenticated hooks work.
 * 
 * Validates Azure AD configuration before creating the instance.
 * 
 * @example
 * ```tsx
 * import { MsalProvider } from '@azure/msal-react';
 * import { msalInstance } from './config/msalConfig';
 * 
 * <MsalProvider instance={msalInstance}>
 *   <App />
 * </MsalProvider>
 * ```
 * 
 * @throws {ConfigurationError} If Azure AD configuration is invalid
 */
/**
 * Validates Azure AD configuration before creating instance
 */
validateAzureAdConfig();

/**
 * Singleton MSAL PublicClientApplication instance
 * 
 * Uses the `msalConfig` above. Import and pass this instance
 * to MsalProvider in your React app so that useMsal/useIsAuthenticated hooks work.
 * 
 * @throws {ConfigurationError} If Azure AD configuration is invalid
 */
export const msalInstance = new PublicClientApplication(msalConfig);

