import axios from "axios";
import qs from "qs";
import { config } from "../config";

/**
 * Minimal user data from Microsoft Graph.
 */
export interface GraphUser {
  /** Azure AD object ID */
  id: string;
  /** Display name */
  displayName?: string;
  /** Email address (mail) */
  mail?: string;
  /** UPN (fallback if mail is missing) */
  userPrincipalName?: string;
  /** Whether account is enabled */
  accountEnabled?: boolean;
}

/**
 * Represents a user plus assigned App Role.
 */
export interface TenantUserWithRole {
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** Email address; prefer `mail`, fallback to `userPrincipalName` */
  email: string;
  /** Full name from Azure AD (displayName) */
  fullName: string;
  /**
   * Role assigned via App Role assignment.
   * E.g. "Supervisor", "Admin", or "Employee".
   */
  role: string;
}

/**
 * Acquire an access token for Microsoft Graph using client credentials flow.
 *
 * Requires in config:
 * - config.azureTenantId
 * - config.azureClientId
 * - config.azureClientSecret
 *
 * @returns A Promise resolving to the bearer token string.
 * @throws Error if any config is missing or the token request fails.
 */
export async function getGraphToken(): Promise<string> {
  const tenantId = config.azureTenantId;
  const clientId = config.azureClientId;
  const clientSecret = config.azureClientSecret;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure AD config: azureTenantId, azureClientId, or azureClientSecret"
    );
  }
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  };
  try {
    const resp = await axios.post(tokenUrl, qs.stringify(params), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const accessToken = resp.data?.access_token;
    if (!accessToken) {
      throw new Error(
        `Token response did not contain access_token. Response: ${JSON.stringify(
          resp.data
        )}`
      );
    }
    return accessToken as string;
  } catch (err: any) {
    if (err.response) {
      throw new Error(
        `Failed to acquire Graph token: HTTP ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      );
    }
    throw new Error(`Failed to acquire Graph token: ${err.message}`);
  }
}

/**
 * Fetch all users in the tenant from Microsoft Graph, paging until no nextLink.
 *
 * @param token - Bearer token for Graph API.
 * @returns Promise resolving to an array of GraphUser.
 * @throws Error if any Graph request fails.
 */
export async function fetchAllUsers(token: string): Promise<GraphUser[]> {
  const users: GraphUser[] = [];
  let url =
    "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,accountEnabled&$top=100";
  while (url) {
    try {
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status !== 200) {
        throw new Error(
          `Graph /users returned status ${resp.status}: ${JSON.stringify(
            resp.data
          )}`
        );
      }
      const data = resp.data as any;
      if (Array.isArray(data.value)) {
        users.push(...data.value);
      }
      url = data["@odata.nextLink"] || "";
    } catch (err: any) {
      if (err.response) {
        throw new Error(
          `Error fetching users: HTTP ${err.response.status} - ${JSON.stringify(
            err.response.data
          )}`
        );
      }
      throw new Error(`Error fetching users: ${err.message}`);
    }
  }
  return users;
}

/**
 * Obtain the Object ID of the Service Principal corresponding to this application.
 *
 * @param token - Bearer token with Graph permissions.
 * @param clientId - Application (client) ID of your App Registration.
 * @returns Promise resolving to the Service Principal's object ID.
 * @throws Error if Graph request fails or no SP found.
 */
export async function getServicePrincipalObjectId(
  token: string,
  clientId: string
): Promise<string> {
  const url = `https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '${clientId}'&$select=id`;
  try {
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.status !== 200) {
      throw new Error(
        `Error fetching servicePrincipal: ${resp.status} ${JSON.stringify(
          resp.data
        )}`
      );
    }
    const arr = resp.data.value;
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error(`ServicePrincipal for appId ${clientId} not found`);
    }
    return arr[0].id as string;
  } catch (err: any) {
    if (err.response) {
      throw new Error(
        `Error fetching servicePrincipal: HTTP ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      );
    }
    throw new Error(`Error fetching servicePrincipal: ${err.message}`);
  }
}

/**
 * Fetch all principal IDs (user or group object IDs) that have been assigned a given App Role.
 *
 * This calls Microsoft Graph:
 *   GET /servicePrincipals/{servicePrincipalId}/appRoleAssignedTo
 *     ?$filter=appRoleId eq guid'{appRoleId}'
 *     &$top=100
 * and pages through @odata.nextLink.
 *
 * IMPORTANT: The filter uses `appRoleId eq guid'{GUID}'` (with guid'' literal syntax).
 *
 * @param token - Bearer token for Microsoft Graph API.
 * @param servicePrincipalId - Object ID of the Service Principal where the App Role is defined.
 *                             This is the Azure AD object ID of the service principal for your App Registration.
 * @param appRoleId - GUID of the App Role (as shown in “App roles” in Azure Portal). Must be the raw GUID string (no braces).
 * @returns A Promise resolving to a Set of principal IDs (strings) that have that App Role assigned.
 * @throws Error if any Graph request fails.
 */

export async function fetchAppRoleMemberIds(
  token: string,
  servicePrincipalId: string,
  appRoleId: string
): Promise<Set<string>> {
  if (!servicePrincipalId) throw new Error("servicePrincipalId is required");
  if (!appRoleId) throw new Error("appRoleId is required");

  const memberIds = new Set<string>();
  // Start without any filter; we'll filter in code
  let url = `https://graph.microsoft.com/v1.0/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo?$top=100`;

  while (url) {
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.status !== 200) {
      throw new Error(`Graph failed: ${resp.status} – ${JSON.stringify(resp.data)}`);
    }
    const data = resp.data as any;

    // Now do the filtering locally
    for (const assignment of data.value || []) {
      if (assignment.appRoleId === appRoleId && assignment.principalId) {
        memberIds.add(assignment.principalId as string);
      }
    }

    url = data["@odata.nextLink"] || "";
  }

  return memberIds;
}

/**
 * Assign an App Role to a principal (user or group).
 *
 * @param token - Bearer token with AppRoleAssignment.ReadWrite.All permission.
 * @param servicePrincipalId - Object ID of the Service Principal of your application.
 * @param principalId - Object ID of the user or group to assign the role to.
 * @param appRoleId - GUID of the App Role.
 * @returns Promise resolving when complete.
 * @throws Error if Graph request fails.
 */
export async function assignAppRoleToPrincipal(
  token: string,
  spObjectId: string,
  principalId: string,
  appRoleId: string
): Promise<void> {
  await axios.post(
    `https://graph.microsoft.com/v1.0/servicePrincipals/${spObjectId}/appRoleAssignedTo`,
    {
      principalId,
      resourceId: spObjectId,
      appRoleId,
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

/**
 * Remove a specific App Role assignment by its assignment object ID.
 *
 * @param token - Bearer token with AppRoleAssignment.ReadWrite.All permission.
 * @param servicePrincipalId - Object ID of the Service Principal of your application.
 * @param assignmentId - Object ID of the specific assignment (from appRoleAssignedTo).
 * @returns Promise resolving when complete.
 * @throws Error if Graph request fails.
 */
export async function removeAppRoleAssignment(
  token: string,
  servicePrincipalId: string,
  assignmentId: string
): Promise<void> {
  const url = `https://graph.microsoft.com/v1.0/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo/${assignmentId}`;
  try {
    await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err: any) {
    if (err.response) {
      throw new Error(
        `Failed to remove AppRoleAssignment ${assignmentId}: HTTP ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      );
    }
    throw new Error(`Failed to remove AppRoleAssignment ${assignmentId}: ${err.message}`);
  }
}

/**
 * Remove **all** App Role assignments for a given **user** on your application’s Service Principal.
 *
 * @param token                   A valid Microsoft Graph bearer token.
 * @param servicePrincipalObjectId  The object ID of your application’s Service Principal.
 * @param userObjectId            The object ID of the user whose roles you wish to clear.
 *
 * @throws When any Graph call fails (list or delete).
 * @remarks
 *   - Uses the user-side endpoint `/users/{id}/appRoleAssignments`.
 *   - Filters assignments to only those granted to *this* Service Principal.
 *   - Logs every GET and DELETE request, as well as success/failure.
 */
export async function removeAllAppRolesFromUser(
  token: string,
  servicePrincipalObjectId: string,
  userObjectId: string
): Promise<void> {
  const baseUrl = `https://graph.microsoft.com/v1.0`;
  const listUrl = `${baseUrl}/users/${userObjectId}/appRoleAssignments` +
    `?$filter=resourceId eq ${servicePrincipalObjectId}`;

  console.info(`[removeAllAppRolesFromUser] Listing assignments for user ${userObjectId}`);
  console.debug(`[removeAllAppRolesFromUser] GET ${listUrl}`);

  let assignments: Array<{ id: string }> = [];
  try {
    const resp = await axios.get(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assignments = resp.data?.value || [];
    console.info(
      `[removeAllAppRolesFromUser] Found ${assignments.length} assignment(s) for SP ${servicePrincipalObjectId}`
    );
  } catch (err: any) {
    console.error(
      `[removeAllAppRolesFromUser] Failed to list user's appRoleAssignments: ${
        err.response?.status
      } - ${JSON.stringify(err.response?.data) || err.message}`
    );
    throw err;
  }

  for (const { id: assignmentId } of assignments) {
    const deleteUrl = `${baseUrl}/users/${userObjectId}/appRoleAssignments/${assignmentId}`;
    console.debug(
      `[removeAllAppRolesFromUser] Deleting assignment ${assignmentId} -> DELETE ${deleteUrl}`
    );
    try {
      await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.info(
        `[removeAllAppRolesFromUser] Successfully deleted assignment ${assignmentId}`
      );
    } catch (err: any) {
      console.error(
        `[removeAllAppRolesFromUser] Failed to delete assignment ${assignmentId}: ${
          err.response?.status
        } - ${JSON.stringify(err.response?.data) || err.message}`
      );
      throw err;
    }
  }

  console.info(
    `[removeAllAppRolesFromUser] Completed clearing App Roles for user ${userObjectId}`
  );
}


/**
 * Fetch all users and return those having one of the given App Roles.
 *
 * @param token - Bearer token for Graph API.
 * @param servicePrincipalId - Object ID of the Service Principal of your application.
 * @param roleMap - Record mapping role name to App Role ID, e.g. { Supervisor: "...", Admin: "...", Employee: "..." }.
 * @returns Promise resolving to array of TenantUserWithRole (only users assigned to one of these roles).
 * @throws Error if Graph requests fail.
 */
export async function fetchUsersWithAppRole(
  token: string,
  servicePrincipalId: string,
  roleMap: Record<string, string>
): Promise<TenantUserWithRole[]> {
  // 1. Fetch all App Role assignments for each role
  const roleIds = Object.values(roleMap);
  const roleNames = Object.keys(roleMap);

  // Prepare map from roleId to roleName
  const idToName: Record<string, string> = {};
  for (const name of roleNames) {
    idToName[roleMap[name]] = name;
  }

  // Fetch member IDs per role
  const fetchPromises = roleIds.map((rid) =>
    fetchAppRoleMemberIds(token, servicePrincipalId, rid)
  );
  const sets = await Promise.all(fetchPromises);
  // Combine into a map: roleName -> Set<principalId>
  const roleSets: Record<string, Set<string>> = {};
  roleNames.forEach((name, idx) => {
    roleSets[name] = sets[idx];
  });

  // 2. Fetch all users
  const allUsers = await fetchAllUsers(token);

  // 3. Filter users who appear in any role set
  const result: TenantUserWithRole[] = [];
  for (const u of allUsers) {
    if (u.accountEnabled === false) continue;
    const id = u.id;
    // Determine role precedence if needed (e.g., Supervisor > Admin > Employee).
    // Here we check in the order of roleNames array.
    let assignedRole: string | undefined;
    for (const roleName of roleNames) {
      if (roleSets[roleName].has(id)) {
        assignedRole = roleName;
        break;
      }
    }
    if (!assignedRole) {
      continue;
    }
    const email = u.mail || u.userPrincipalName || "";
    const fullName = u.displayName || "";
    if (!email) {
      // skip if no usable email/UPN
      continue;
    }
    result.push({
      azureAdObjectId: id,
      email,
      fullName,
      role: assignedRole,
    });
  }
  return result;
}
