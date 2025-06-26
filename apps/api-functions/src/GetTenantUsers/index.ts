import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import {
  getGraphToken,
  fetchAllUsers,
  fetchAppRoleMemberIds,
} from "../shared/services/graphService";

/**
 * Minimal representation of an Azure AD user as returned by Microsoft Graph.
 */
interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

/**
 * Representation of a tenant user who has no App Role assigned,
 * with first and last name split out.
 */
interface TenantUser {
  azureAdObjectId: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Splits a full display name into firstName and lastName.
 *
 * - firstName: the first word of the fullName
 * - lastName: the remainder (joined by spaces), or empty string
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" "),
  };
}

/**
 * Handles an HTTP request to list all tenant users without any of the
 * Supervisor, Admin, or Employee App Roles assigned.
 */
async function getTenantUsersHandler(
  ctx: Context,
  req: HttpRequest
): Promise<void> {
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
  const supRoleId = process.env.SUPERVISORS_GROUP_ID!;
  const adminRoleId = process.env.ADMINS_GROUP_ID!;
  const empRoleId = process.env.EMPLOYEES_GROUP_ID!;
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
    supIds = await fetchAppRoleMemberIds(token, servicePrincipalId, supRoleId);
    adminIds = await fetchAppRoleMemberIds(
      token,
      servicePrincipalId,
      adminRoleId
    );
    empIds = await fetchAppRoleMemberIds(
      token,
      servicePrincipalId,
      empRoleId
    );
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
  const unassigned: TenantUser[] = [];
  for (const u of allUsers) {
    if (u.accountEnabled === false) continue;
    const id = u.id;
    if (supIds.has(id) || adminIds.has(id) || empIds.has(id)) continue;

    const email = u.mail || u.userPrincipalName || "";
    if (!email) {
      ctx.log.warn(`[GetTenantUsers] Skipping ${id}: no mail or UPN`);
      continue;
    }

    // split the display name into first/last
    const displayName = u.displayName || "";
    const { firstName, lastName } = splitName(displayName);

    unassigned.push({ azureAdObjectId: id, email, firstName, lastName });
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
 */
const getTenantUsers: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
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
