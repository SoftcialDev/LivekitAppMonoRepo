import * as process from "process";
import { z } from 'zod';
import { createLazySingletonProxy } from '../infrastructure/utils/LazySingletonProxy';
import { ConfigurationError } from '../domain/errors/InfrastructureErrors';

/**
 * Zod schema for configuration validation
 * Validates all environment variables at application startup
 */
const configSchema = z.object({
  databaseUrl: z.string().url("DATABASE_URL must be a valid URL").min(1, "DATABASE_URL is required"),
  livekitApiUrl: z.string().url("LIVEKIT_API_URL must be a valid URL").min(1, "LIVEKIT_API_URL is required"),
  livekitApiKey: z.string().min(1, "LIVEKIT_API_KEY is required"),
  livekitApiSecret: z.string().min(1, "LIVEKIT_API_SECRET is required"),
  serviceBusConnection: z.string().min(1, "SERVICE_BUS_CONNECTION is required"),
  webPubSubEndpoint: z.string().url("WEBPUBSUB_ENDPOINT must be a valid URL").min(1, "WEBPUBSUB_ENDPOINT is required"),
  webPubSubKey: z.string().min(1, "WEBPUBSUB_KEY is required"),
  webPubSubHubName: z.string().min(1, "WEBPUBSUB_HUB is required"),
  azureTenantId: z.string().uuid("AZURE_TENANT_ID must be a valid UUID").min(1, "AZURE_TENANT_ID is required"),
  azureClientId: z.string().uuid("AZURE_CLIENT_ID must be a valid UUID").min(1, "AZURE_CLIENT_ID is required"),
  azureClientSecret: z.string().min(1, "AZURE_CLIENT_SECRET is required"),
  serviceBusTopicName: z.string().min(1, "SERVICE_BUS_TOPIC_NAME is required"),
  node_env: z.string().min(1, "NODE_ENV is required"),
  azureAdApiIdentifierUri: z.string().url("AZURE_AD_API_IDENTIFIER_URI must be a valid URL").min(1, "AZURE_AD_API_IDENTIFIER_URI is required"),
  servicePrincipalObjectId: z.string().min(1, "SERVICE_PRINCIPAL_OBJECT_ID is required"),
  commandsSubscriptionName: z.string().min(1, "COMMANDS_SUBSCRIPTION_NAME is required"),
  accountName: z.string().optional(),
  accountKey: z.string().optional(),
  storageConnectionString: z.string().optional(),
  recordingsContainerName: z.string().min(1),
  snapshotContainerName: z.string().min(1, "SNAPSHOT_CONTAINER_NAME is required"),
  migrationForceReset: z.string().optional(),
  webPubSubConnection: z.string().optional()
});

/**
 * Raw environment variables object with defaults applied
 */
const rawConfig = {
  databaseUrl: process.env.DATABASE_URL,
  livekitApiUrl: process.env.LIVEKIT_API_URL,
  livekitApiKey: process.env.LIVEKIT_API_KEY,
  livekitApiSecret: process.env.LIVEKIT_API_SECRET,
  serviceBusConnection: process.env.SERVICE_BUS_CONNECTION,
  webPubSubEndpoint: process.env.WEBPUBSUB_ENDPOINT,
  webPubSubKey: process.env.WEBPUBSUB_KEY,
  webPubSubHubName: process.env.WEBPUBSUB_HUB,
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  azureClientSecret: process.env.AZURE_CLIENT_SECRET,
  serviceBusTopicName: process.env.SERVICE_BUS_TOPIC_NAME,
  node_env: process.env.NODE_ENV,
  azureAdApiIdentifierUri: process.env.AZURE_AD_API_IDENTIFIER_URI,
  servicePrincipalObjectId: process.env.SERVICE_PRINCIPAL_OBJECT_ID,
  commandsSubscriptionName: process.env.COMMANDS_SUBSCRIPTION_NAME || "commands-sub",
  accountName: process.env.AZURE_STORAGE_ACCOUNT,
  accountKey: process.env.AZURE_STORAGE_KEY,
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  recordingsContainerName: process.env.RECORDINGS_CONTAINER_NAME || "recordings",
  snapshotContainerName: process.env.SNAPSHOT_CONTAINER_NAME,
  migrationForceReset: process.env.MIGRATION_FORCE_RESET,
  webPubSubConnection: process.env.WEBPUBSUB_CONNECTION
};

/**
 * Factory function to create and validate configuration
 * @returns Validated configuration object
 * @throws ConfigurationError with detailed list of missing/invalid variables
 */
function createConfig(): z.infer<typeof configSchema> {
  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .map(e => {
          const path = e.path.length > 0 ? e.path.join('.') : 'root';
          return `  - ${path}: ${e.message}`;
        })
        .join('\n');
      throw new ConfigurationError(
        `Missing or invalid environment variables:\n${missingFields}\n\n` +
        `Please ensure all required environment variables are set in your Azure Function App settings.`
      );
    }
    throw error;
  }
}

/**
 * Validated configuration object
 * Uses lazy initialization to avoid module load failures
 * Only validates when first accessed, allowing handlers to load even if config is incomplete
 * @throws ConfigurationError with detailed list of missing/invalid variables when accessed
 */
export const config = createLazySingletonProxy(createConfig);