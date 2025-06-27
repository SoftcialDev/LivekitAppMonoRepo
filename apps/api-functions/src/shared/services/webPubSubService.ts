import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { config } from "../config";

/**
 * WebPubSubServiceClient instance configured with endpoint, key, and hub name.
 */
const wpsClient = new WebPubSubServiceClient(
  config.webPubSubEndpoint,
  new AzureKeyCredential(config.webPubSubKey),
  config.webPubSubHubName
);

/**
 * Generates a client access token for a specific group.
 *
 * @param groupName - Identifier for the group (e.g., an employee’s email).
 * @returns A promise that resolves to a signed JWT for connecting to Web PubSub.
 * @throws Errors from the Web PubSub SDK are propagated.
 */
export async function generateWebPubSubToken(groupName: string): Promise<string> {
  // Normalize input to avoid casing or whitespace inconsistencies
  const normalized = groupName.trim().toLowerCase();

  const tokenResponse = await wpsClient.getClientAccessToken({
    roles: ["webpubsub.joinLeaveGroup", "webpubsub.receive"],
    userId: normalized,
    groups: [normalized],
  });

  return tokenResponse.token;
}


/**
 * Broadcasts a JSON-serializable payload to all connections in the given group.
 *
 * @param groupName - Name of the target group (e.g., an employee’s email).
 * @param payload - Data to send; must be JSON-serializable.
 * @returns A promise that resolves when the message has been sent.
 * @throws Errors from the Web PubSub SDK are propagated.
 */
export async function sendToGroup(
  groupName: string,
  payload: unknown
): Promise<void> {
  const groupClient = wpsClient.group(groupName);
  await groupClient.sendToAll(JSON.stringify(payload));
}
