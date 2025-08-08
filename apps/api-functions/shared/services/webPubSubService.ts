import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { config } from "../config";

/**
 * Singleton WebPubSubServiceClient configured with endpoint, credential, and hub name.
 */
const wpsClient = new WebPubSubServiceClient(
  config.webPubSubEndpoint,
  new AzureKeyCredential(config.webPubSubKey),
  config.webPubSubHubName
);

/**
 * Options for generating a client access token.
 */
export interface WebPubSubTokenOptions {
  /** Unique identifier for this client (will become the Web PubSub userId) */
  userId: string;
  /** List of groups this client should join */
  groups: string[];
}

/**
 * Generates a client access token for a user to connect to Web PubSub.
 *
 * @param opts.userId - The normalized user identifier (e.g. an employee email).
 * @param opts.groups - The list of group names to subscribe to.
 * @returns A Promise that resolves to a JWT token string for authentication.
 * @throws Propagates any errors from the Web PubSub SDK.
 */
export async function generateWebPubSubToken(
  opts: WebPubSubTokenOptions
): Promise<string> {
  const normalizedUser = opts.userId.trim().toLowerCase();
  const normalizedGroups = opts.groups.map(g => g.trim().toLowerCase());

  const wpsClient = new WebPubSubServiceClient(
    config.webPubSubEndpoint,
    new AzureKeyCredential(config.webPubSubKey),
    config.webPubSubHubName
  );

  const tokenResponse = await wpsClient.getClientAccessToken({
    roles:  ["webpubsub.joinLeaveGroup", "webpubsub.receive"],
    userId: normalizedUser,
    groups: normalizedGroups,
  });

  return tokenResponse.token;
}
/**
 * Broadcasts a JSON-serializable payload to all clients in the specified group.
 *
 * @param groupName - The name of the target group (e.g., an employee's email).
 * @param payload - The data to send; must be JSON-serializable.
 * @returns A Promise that resolves when the broadcast completes.
 * @throws Propagates any errors from the Web PubSub SDK.
 */
export async function sendToGroup(
  groupName: string,
  payload: unknown
): Promise<void> {
  const groupClient = wpsClient.group(groupName);
  await groupClient.sendToAll(JSON.stringify(payload));
  console.debug(`Broadcast to group '${groupName}'`, payload);
}

/**
 * Sends a presence event to all clients in the global 'presence' group.
 *
 * @param payload - The presence information: email, fullName, status, lastSeenAt.
 * @returns A Promise that resolves when the presence event is broadcast.
 * @throws Propagates any errors from the Web PubSub SDK.
 */
export async function broadcastPresence(
  payload: {
    email: string;
    fullName: string;
    status: "online" | "offline";
    lastSeenAt: string;
  }
): Promise<void> {
  const event = { type: "presence", user: payload };
  await wpsClient.group("presence").sendToAll(JSON.stringify(event));
  console.debug("Presence broadcast:", event);
}
