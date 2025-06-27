import * as process from "process";

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  livekitApiUrl: process.env.LIVEKIT_API_URL!,
  livekitApiKey: process.env.LIVEKIT_API_KEY!,
  livekitApiSecret:process.env.LIVEKIT_API_SECRET!,
  serviceBusConnection: process.env.SERVICE_BUS_CONNECTION!,
  webPubSubEndpoint: process.env.WEBPUBSUB_ENDPOINT!,
  webPubSubKey: process.env.WEBPUBSUB_KEY!,
  webPubSubHubName: process.env.WEBPUBSUB_NAME!,
  azureTenantId: process.env.AZURE_TENANT_ID!,
  azureClientId: process.env.AZURE_CLIENT_ID!,
  azureClientSecret: process.env.AZURE_CLIENT_SECRET!,
  serviceBusTopicName : process.env.SERVICE_BUS_TOPIC_NAME!,
  node_env : process.env.NODE_ENV!,
  adminsGroupId : process.env.ADMINS_GROUP_ID!,
  supervisorsGroupId : process.env.SUPERVISORS_GROUP_ID!,
  employeesGroupId : process.env.EMPLOYEES_GROUP_ID!,
  azureAdApiIdentifierUri : process.env.AZURE_AD_API_IDENTIFIER_URI!,
  servicePrincipalObjectId : process.env.SERVICE_PRINCIPAL_OBJECT_ID!,
  commandsSubscriptionName: process.env.COMMANDS_SUBSCRIPTION_NAME || "commands-sub"
};

if (!config.databaseUrl) throw new Error("DATABASE_URL is required");
if (!config.livekitApiUrl) throw new Error("LIVEKIT_API_URL is required");
if (!config.livekitApiKey) throw new Error("LIVEKIT_API_KEY is required");
if (!config.livekitApiSecret) throw new Error("LIVEKIT_API_SECRET is required");
if (!config.serviceBusConnection) throw new Error("SERVICE_BUS_CONNECTION is required");
if (!config.webPubSubEndpoint) throw new Error("WEBPUBSUB_ENDPOINT is required");
if (!config.webPubSubKey) throw new Error("WEBPUBSUB_KEY is required");
if (!config.azureTenantId) throw new Error("AZURE_TENANT_ID is required");
if (!config.azureClientId) throw new Error("AZURE_CLIENT_ID is required");
if (!config.azureClientSecret) throw new Error("AZURE_CLIENT_SECRET is required");
if (!config.serviceBusTopicName) throw new Error("SERVICE_BUS_TOPIC_NAME is required");
if (!config.webPubSubHubName) throw new Error("WEBPUBSUB_NAME is required");
if (!config.node_env) throw new Error("NODE_ENV is required");
if (!config.adminsGroupId) throw new Error("ADMINS_GROUP_ID is required");
if (!config.azureAdApiIdentifierUri) throw new Error("AZURE_AD_API_IDENTIFIER_URI is required");
if (!config.servicePrincipalObjectId) throw new Error("SERVICE_PRINCIPAL_OBJECT_ID is required");
if (!config.supervisorsGroupId) throw new Error("SUPERVISORS_GROUP_ID is required");
if (!config.employeesGroupId) throw new Error("EMPLOYEES_GROUP_ID is required");
if (!config.commandsSubscriptionName) throw new Error("COMMANDS_SUBSCRIPTION_NAME is required");
