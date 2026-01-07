import * as process from "process";
import { z } from 'zod';

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
  adminsGroupId: z.string().uuid("ADMINS_GROUP_ID must be a valid UUID").min(1, "ADMINS_GROUP_ID is required"),
  supervisorsGroupId: z.string().uuid("SUPERVISORS_GROUP_ID must be a valid UUID").min(1, "SUPERVISORS_GROUP_ID is required"),
  employeesGroupId: z.string().uuid("EMPLOYEES_GROUP_ID must be a valid UUID").min(1, "EMPLOYEES_GROUP_ID is required"),
  azureAdApiIdentifierUri: z.string().url("AZURE_AD_API_IDENTIFIER_URI must be a valid URL").min(1, "AZURE_AD_API_IDENTIFIER_URI is required"),
  servicePrincipalObjectId: z.string().uuid("SERVICE_PRINCIPAL_OBJECT_ID must be a valid UUID").min(1, "SERVICE_PRINCIPAL_OBJECT_ID is required"),
  commandsSubscriptionName: z.string().min(1, "COMMANDS_SUBSCRIPTION_NAME is required"),
  contactManagerAppRoleId: z.string().uuid("CONTACT_MANAGER_GROUP_ID must be a valid UUID").min(1, "CONTACT_MANAGER_GROUP_ID is required"),
  accountName: z.string().optional(),
  accountKey: z.string().optional(),
  storageConnectionString: z.string().optional(),
  superAdminAppRoleId: z.string().uuid("SUPER_ADMIN_GROUP_ID must be a valid UUID").optional(),
  recordingsContainerName: z.string().min(1),
  snapshotContainerName: z.string().min(1, "SNAPSHOT_CONTAINER_NAME is required")
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
  adminsGroupId: process.env.ADMINS_GROUP_ID,
  supervisorsGroupId: process.env.SUPERVISORS_GROUP_ID,
  employeesGroupId: process.env.EMPLOYEES_GROUP_ID,
  azureAdApiIdentifierUri: process.env.AZURE_AD_API_IDENTIFIER_URI,
  servicePrincipalObjectId: process.env.SERVICE_PRINCIPAL_OBJECT_ID,
  commandsSubscriptionName: process.env.COMMANDS_SUBSCRIPTION_NAME || "commands-sub",
  contactManagerAppRoleId: process.env.CONTACT_MANAGER_GROUP_ID,
  accountName: process.env.AZURE_STORAGE_ACCOUNT,
  accountKey: process.env.AZURE_STORAGE_KEY,
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  superAdminAppRoleId: process.env.SUPER_ADMIN_GROUP_ID,
  recordingsContainerName: process.env.RECORDINGS_CONTAINER_NAME || "recordings",
  snapshotContainerName: process.env.SNAPSHOT_CONTAINER_NAME
};

/**
 * Validated configuration object
 * Throws descriptive error if validation fails
 */
export const config = configSchema.parse(rawConfig);