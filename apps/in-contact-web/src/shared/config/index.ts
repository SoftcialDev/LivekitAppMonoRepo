/**
 * @fileoverview Configuration management for frontend application
 * @summary Validates and exports environment variables with type safety
 * @description Centralizes all environment variable access with validation.
 * Validates required configuration at module load time to fail fast if configuration is invalid.
 */

import { ConfigurationError } from '../errors/ConfigurationError';
import { isValidUrl, isNonEmptyString } from '../utils/validation';
import type { IAppConfig } from './types';

/**
 * Creates and validates application configuration from environment variables
 * 
 * Validates that all required environment variables are present and correctly
 * formatted. Optional variables are included in the config if provided.
 * 
 * @returns Validated configuration object
 * @throws {ConfigurationError} If required environment variables are missing or invalid
 */
function createConfig(): IAppConfig {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!isNonEmptyString(apiUrl)) {
    throw new ConfigurationError(
      'VITE_API_URL is required and must be a non-empty string. ' +
        'Please set it in your .env file.'
    );
  }

  if (!isValidUrl(apiUrl)) {
    throw new ConfigurationError(
      `VITE_API_URL must be a valid URL. Got: "${apiUrl}". ` +
        'Please check your .env file.'
    );
  }

  const config: IAppConfig = {
    apiUrl: apiUrl.trim(),
  };

  // Optional Azure AD configuration
  const azureAdClientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID;
  const azureAdTenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID;
  const azureAdRedirectUri = import.meta.env.VITE_AZURE_AD_REDIRECT_URI;
  const azureAdApiScopeUri = import.meta.env.VITE_AZURE_AD_API_SCOPE_URI;

  if (azureAdClientId && isNonEmptyString(azureAdClientId)) {
    config.azureAdClientId = azureAdClientId.trim();
  }

  if (azureAdTenantId && isNonEmptyString(azureAdTenantId)) {
    config.azureAdTenantId = azureAdTenantId.trim();
  }

  if (azureAdRedirectUri && isNonEmptyString(azureAdRedirectUri)) {
    if (!isValidUrl(azureAdRedirectUri)) {
      throw new ConfigurationError(
        `VITE_AZURE_AD_REDIRECT_URI must be a valid URL. Got: "${azureAdRedirectUri}". ` +
          'Please check your .env file.'
      );
    }
    config.azureAdRedirectUri = azureAdRedirectUri.trim();
  }

  if (azureAdApiScopeUri && isNonEmptyString(azureAdApiScopeUri)) {
    config.azureAdApiScopeUri = azureAdApiScopeUri.trim();
  }

  return config;
}

/**
 * Validated application configuration object
 * 
 * This configuration is validated at module load time, ensuring the application
 * fails to start if required environment variables are missing or invalid.
 * This provides immediate feedback during development and prevents runtime errors
 * from configuration issues.
 * 
 * @throws {ConfigurationError} If required environment variables are missing or invalid
 */
export const config: IAppConfig = createConfig();

// Re-export types for convenience
export type { IAppConfig } from './types';

