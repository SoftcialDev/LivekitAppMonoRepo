import axios from "axios";
import qs from "qs";
import { config } from "../config";

/**
 * Retrieves an access token for Microsoft Graph using the client credentials flow.
 *
 * @returns A promise that resolves to a bearer token string.
 * @throws Error if the token request fails.
 */
async function getGraphToken(): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${config.azureTenantId}/oauth2/v2.0/token`;
  const params = {
    client_id: config.azureClientId,
    client_secret: config.azureClientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  };
  const resp = await axios.post(tokenUrl, qs.stringify(params), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return resp.data.access_token as string;
}

/**
 * Adds a user to an Azure AD group.
 *
 * @param userObjectId - The Azure AD object ID of the user to add.
 * @param groupId - The Azure AD object ID of the target group.
 * @returns A promise that resolves when the API call completes.
 * @throws Error if the Graph API request fails.
 */
export async function addUserToGroup(
  userObjectId: string,
  groupId: string
): Promise<void> {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/$ref`;
  const body = {
    "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userObjectId}`
  };
  await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
}

/**
 * Removes a user from an Azure AD group.
 *
 * @param userObjectId - The Azure AD object ID of the user to remove.
 * @param groupId - The Azure AD object ID of the group.
 * @returns A promise that resolves when the API call completes.
 * @throws Error if the Graph API request fails.
 */
export async function removeUserFromGroup(
  userObjectId: string,
  groupId: string
): Promise<void> {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/${userObjectId}/$ref`;
  await axios.delete(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
