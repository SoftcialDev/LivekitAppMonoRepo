/**
 * @fileoverview HealthCheckDomainService - Domain service for health check operations
 * @summary Handles business logic for health check validations
 * @description Encapsulates business rules for environment variable validation and health status determination
 */

import { HealthStatus } from '../enums/HealthStatus';
import { EnvCheck } from '../types/HealthCheckTypes';
import { config } from '../../config';
import { isEmpty, isNotEmpty } from '../../utils/stringHelpers';

/**
 * Required environment variable keys for the application
 */
const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "LIVEKIT_API_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "SERVICE_BUS_CONNECTION",
  "WEBPUBSUB_ENDPOINT",
  "WEBPUBSUB_KEY",
  "WEBPUBSUB_HUB",
  "AZURE_TENANT_ID",
  "AZURE_CLIENT_ID",
  "AZURE_CLIENT_SECRET",
  "SERVICE_BUS_TOPIC_NAME",
  "NODE_ENV",
  "ADMINS_GROUP_ID",
  "SUPERVISORS_GROUP_ID",
  "EMPLOYEES_GROUP_ID",
  "AZURE_AD_API_IDENTIFIER_URI",
  "SERVICE_PRINCIPAL_OBJECT_ID",
  "CONTACT_MANAGER_GROUP_ID",
  "COMMANDS_SUBSCRIPTION_NAME",
  "AZURE_STORAGE_ACCOUNT",
  "AZURE_STORAGE_KEY",
  "SUPER_ADMIN_GROUP_ID"
] as const;

/**
 * Domain service for health check operations
 * @description Handles business logic for environment variable validation
 */
export class HealthCheckDomainService {
  /**
   * Validates required environment variables
   * @param storageDetails - Optional storage details to include in verbose mode
   * @returns Environment check result with missing and present keys
   */
  validateEnvironmentVariables(storageDetails?: EnvCheck['storageDetails']): EnvCheck {
    const missingKeys = REQUIRED_ENV_KEYS.filter((k) => {
      const val = this.getEnvValue(k);
      return isEmpty(val);
    });

    const presentKeys = REQUIRED_ENV_KEYS.filter((k) => {
      const val = this.getEnvValue(k);
      return isNotEmpty(val);
    });

    return {
      status: missingKeys.length === 0 ? HealthStatus.OK : HealthStatus.FAIL,
      missingKeys,
      presentKeys: storageDetails ? presentKeys : undefined,
      storageDetails
    };
  }

  /**
   * Gets environment variable value from config or process.env as fallback
   * @param key - Environment variable key
   * @returns Environment variable value or undefined
   */
  private getEnvValue(key: string): string | undefined {
    // Map config properties to environment variable keys
    const configMap: Record<string, string | undefined> = {
      'DATABASE_URL': config.databaseUrl,
      'LIVEKIT_API_URL': config.livekitApiUrl,
      'LIVEKIT_API_KEY': config.livekitApiKey,
      'LIVEKIT_API_SECRET': config.livekitApiSecret,
      'SERVICE_BUS_CONNECTION': config.serviceBusConnection,
      'WEBPUBSUB_ENDPOINT': config.webPubSubEndpoint,
      'WEBPUBSUB_KEY': config.webPubSubKey,
      'WEBPUBSUB_HUB': config.webPubSubHubName,
      'AZURE_TENANT_ID': config.azureTenantId,
      'AZURE_CLIENT_ID': config.azureClientId,
      'AZURE_CLIENT_SECRET': config.azureClientSecret,
      'SERVICE_BUS_TOPIC_NAME': config.serviceBusTopicName,
      'NODE_ENV': config.node_env,
      'AZURE_AD_API_IDENTIFIER_URI': config.azureAdApiIdentifierUri,
      'SERVICE_PRINCIPAL_OBJECT_ID': config.servicePrincipalObjectId,
      'AZURE_STORAGE_ACCOUNT': config.accountName,
      'AZURE_STORAGE_KEY': config.accountKey
    };

    return configMap[key];
  }

  /**
   * Determines overall health status based on environment and database checks
   * @param envStatus - Environment check status
   * @param databaseStatus - Optional database check status
   * @returns Overall health status
   */
  determineOverallStatus(envStatus: HealthStatus, databaseStatus?: HealthStatus): HealthStatus {
    if (envStatus === HealthStatus.FAIL) {
      return HealthStatus.FAIL;
    }
    
    if (databaseStatus && databaseStatus === HealthStatus.FAIL) {
      return HealthStatus.FAIL;
    }
    
    return HealthStatus.OK;
  }

  /**
   * Gets the list of required environment variable keys
   * @returns Array of required environment variable keys
   */
  getRequiredEnvKeys(): readonly string[] {
    return REQUIRED_ENV_KEYS;
  }
}

