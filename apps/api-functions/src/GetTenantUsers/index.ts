import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { getGraphToken, fetchAllUsers, fetchAppRoleMemberIds } from "../shared/services/graphService";

/**
 * Minimal representation of an Azure AD user as returned by Microsoft Graph.
 *
 * @interface GraphUser
 * @property {string} id
 *   The Azure AD object ID of the user.
 * @property {string} [displayName]
 *   The user's display name.
 * @property {string} [mail]
 *   The user's email address, if set.
 * @property {string} [userPrincipalName]
 *   Fallback UPN/email if `mail` is not present.
 * @property {boolean} [accountEnabled]
 *   Whether the user account is enabled.
 */
interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

/**
 * Representation of a tenant user who has no App Role assigned.
 *
 * @interface TenantUserNoRole
 * @property {string} azureAdObjectId
 *   The Azure AD object ID of the user.
 * @property {string} email
 *   The user's email or UPN.
 * @property {string} fullName
 *   The user's display name.
 */
interface TenantUserNoRole {
  azureAdObjectId: string;
  email: string;
  fullName: string;
}

/**
 * Handles an HTTP request to list all tenant users without any of the
 * Supervisor, Admin, or Employee App Roles assigned.
 *
 * @async
 * @function getTenantUsersHandler
 * @param {Context} ctx
 *   The Azure Functions execution context. Used for logging and setting `ctx.res`.
 * @param {HttpRequest} req
 *   The incoming HTTP request (unused in this handler).
 * @returns {Promise<void>}
 *   Resolves once `ctx.res` has been populated with the appropriate status
 *   and body.
 *
 * @remarks
 * Steps performed by this handler:
 * 1. Acquire a Microsoft Graph access token via client credentials.  
 * 2. Read the Supervisor, Admin, and Employee App Role IDs and the
 *    Service Principal ID from environment variables.  
 * 3. Fetch the member IDs of each App Role from Graph.  
 * 4. Fetch all users in the tenant from Graph.  
 * 5. Exclude disabled accounts, users missing an email/UPN, and any user
 *    already assigned one of the three roles.  
 * 6. If no unassigned users remain, return HTTP 204 No Content; otherwise
 *    return HTTP 200 OK with `{ count, users }`.
 *
 * @throws Never throws uncaught — all errors are caught and returned as HTTP
 *   4xx or 5xx responses.
 */
async function getTenantUsersHandler(ctx: Context, req: HttpRequest): Promise<void> {
  ctx.log.info("[GetTenantUsers] Entry — listing unassigned users");

  // 1. Acquire Graph token
  let token: string;
  try {
    token = await getGraphToken();
  } catch (err: any) {
    ctx.log.error("[GetTenantUsers] Failed to acquire Graph token", err);
    ctx.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Unable to acquire Graph token", detail: err.message },
    };
    return;
  }

  // 2. Read App Role and SP IDs from environment
  const supRoleId          = process.env.SUPERVISORS_GROUP_ID!;
  const adminRoleId        = process.env.ADMINS_GROUP_ID!;
  const empRoleId          = process.env.EMPLOYEES_GROUP_ID!;
  const servicePrincipalId = process.env.SERVICE_PRINCIPAL_OBJECT_ID!;
  if (!supRoleId || !adminRoleId || !empRoleId || !servicePrincipalId) {
    ctx.log.error("[GetTenantUsers] Missing role or SP ID in environment");
    ctx.res = {
      status: 400,
      body: { error: "Configuration error: missing App Role or SP IDs" },
    };
    return;
  }

  // 3. Fetch App Role member IDs
  let supIds: Set<string>, adminIds: Set<string>, empIds: Set<string>;
  try {
    supIds   = await fetchAppRoleMemberIds(token, servicePrincipalId, supRoleId);
    adminIds = await fetchAppRoleMemberIds(token, servicePrincipalId, adminRoleId);
    empIds   = await fetchAppRoleMemberIds(token, servicePrincipalId, empRoleId);
  } catch (err: any) {
    ctx.log.error("[GetTenantUsers] Error fetching App Role members", err);
    ctx.res = {
      status: 502,
      headers: { "Content-Type": "application/json" },
      body: { error: "Failed to fetch App Role members", detail: err.message },
    };
    return;
  }

  // 4. Fetch all users from Graph
  let allUsers: GraphUser[];
  try {
    allUsers = await fetchAllUsers(token);
  } catch (err: any) {
    ctx.log.error("[GetTenantUsers] Error fetching all users", err);
    ctx.res = {
      status: 502,
      headers: { "Content-Type": "application/json" },
      body: { error: "Failed to fetch users", detail: err.message },
    };
    return;
  }

  // 5. Filter out users who have any of the roles or are disabled/no-email
  const unassigned: TenantUserNoRole[] = [];
  for (const u of allUsers) {
    if (u.accountEnabled === false) {
      continue; // skip disabled accounts
    }
    const id = u.id;
    if (supIds.has(id) || adminIds.has(id) || empIds.has(id)) {
      continue; // skip users already assigned a role
    }
    const email = u.mail || u.userPrincipalName || "";
    if (!email) {
      ctx.log.warn(`[GetTenantUsers] Skipping ${id}: no mail or UPN`);
      continue;
    }
    unassigned.push({
      azureAdObjectId: id,
      email,
      fullName: u.displayName || "",
    });
  }

  // 6. Return results
  if (unassigned.length === 0) {
    ctx.res = { status: 204, body: null };
  } else {
    ctx.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { count: unassigned.length, users: unassigned },
    };
  }
}

/**
 * Azure Function: GetTenantUsers
 *
 * Entry point for listing tenant users without any App Roles.
 *  
 * @constant
 * @type {AzureFunction}
 * @remarks
 * - Wrapped with `withAuth` to enforce JWT-based authentication.
 * - Wrapped with `withErrorHandler` to catch uncaught exceptions
 *   and return HTTP 500 with a generic message.
 */
const getTenantUsers: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // If earlier middleware set an error response, skip handler
      if (ctx.res && typeof (ctx.res as any).status === "number" && ctx.res.status >= 400) {
        return;
      }
      await getTenantUsersHandler(ctx, req);
    });
  },
  {
    genericMessage: "Internal Server Error in GetTenantUsers",
    showStackInDev: true,
  }
);

export default getTenantUsers;
