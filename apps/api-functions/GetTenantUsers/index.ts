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
 * Representation of a tenant user with their current App-Role.
 */
interface TenantUser {
  azureAdObjectId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "Supervisor" | "Admin" | "Employee" | "ContactManager" | "None";
}

/**
 * Splits a full display name into firstName and lastName.
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" "),
  };
}

/**
 * Handles an HTTP request to list every tenant user along with their current App-Role.
 */
async function getTenantUsersHandler(
  ctx: Context,
  req: HttpRequest
): Promise<void> {
  ctx.log.info("[GetTenantUsers] Entry — listing all users with their role");

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

  // 2. Read App-Role IDs and Service Principal ID from environment
  const supRoleId            = process.env.SUPERVISORS_GROUP_ID!;
  const adminRoleId          = process.env.ADMINS_GROUP_ID!;
  const empRoleId            = process.env.EMPLOYEES_GROUP_ID!;
  const cmRoleId             = process.env.CONTACT_MANAGER_GROUP_ID!;
  const servicePrincipalId   = process.env.SERVICE_PRINCIPAL_OBJECT_ID!;

  if (
    !supRoleId ||
    !adminRoleId ||
    !empRoleId ||
    !cmRoleId ||
    !servicePrincipalId
  ) {
    ctx.log.error("[GetTenantUsers] Missing App-Role or SP ID in environment");
    ctx.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Configuration error: missing App Role or SP IDs" },
    };
    return;
  }

  // 3. Fetch all App-Role assignments in parallel
  let supIds: Set<string>, adminIds: Set<string>, empIds: Set<string>, cmIds: Set<string>;
  try {
    [supIds, adminIds, empIds, cmIds] = await Promise.all([
      fetchAppRoleMemberIds(token, servicePrincipalId, supRoleId),
      fetchAppRoleMemberIds(token, servicePrincipalId, adminRoleId),
      fetchAppRoleMemberIds(token, servicePrincipalId, empRoleId),
      fetchAppRoleMemberIds(token, servicePrincipalId, cmRoleId),
    ]);
  } catch (err: any) {
    ctx.log.error("[GetTenantUsers] Error fetching App-Role members", err);
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

  // 5. Map each Graph user to TenantUser, determining their role
  const users: TenantUser[] = allUsers
    // optional: skip disabled accounts
    .filter(u => u.accountEnabled !== false)
    .map(u => {
      const id    = u.id;
      const email = u.mail ?? u.userPrincipalName ?? "";
      const name  = u.displayName ?? "";
      const { firstName, lastName } = splitName(name);

      // Determine role
      let role: TenantUser["role"] = "None";
      if (supIds.has(id))       role = "Supervisor";
      else if (adminIds.has(id)) role = "Admin";
      else if (empIds.has(id))   role = "Employee";
      else if (cmIds.has(id))    role = "ContactManager";

      return { azureAdObjectId: id, email, firstName, lastName, role };
    })
    // optional: skip users without any email/UPN
    .filter(u => u.email);

  // 6. Return results
  ctx.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { total: users.length, users },
  };
}

/**
 * Azure Function: GetTenantUsers
 * Entry point for listing tenant users and their App-Roles.
 */
const getTenantUsers: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await getTenantUsersHandler(ctx, req);
    });
  },
  {
    genericMessage: "Internal Server Error in GetTenantUsers",
    showStackInDev: true,
  }
);

export default getTenantUsers;
