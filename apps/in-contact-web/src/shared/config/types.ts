/**
 * @fileoverview Configuration type definitions
 * @summary Type definitions for application configuration
 * @description Defines the structure and types for application configuration
 */

/**
 * Application configuration interface
 * 
 * Defines all configurable values for the application, including required
 * API URL and optional Azure AD authentication settings.
 */
export interface IAppConfig {
  /** Base URL for the backend API (required) */
  apiUrl: string;
  
  /** Azure AD client ID for authentication (optional) */
  azureAdClientId?: string;
  
  /** Azure AD tenant ID for authentication (optional) */
  azureAdTenantId?: string;
  
  /** Azure AD redirect URI for OAuth flow (optional) */
  azureAdRedirectUri?: string;

  /** Azure AD API scope URI for token acquisition (optional) */
  azureAdApiScopeUri?: string;
}

