import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest, forbidden } from "../shared/utils/response";
import axios from "axios";
import { getGraphToken, getServicePrincipalObjectId, removeAllAppRolesFromUser, assignAppRoleToPrincipal } from "../shared/services/graphService";
import { config } from "../shared/config";
import type { JwtPayload } from "jsonwebtoken";
import { findOrCreateAdmin, deleteUserByEmail, upsertUserRole } from "../shared/services/userService";
import { setUserOffline } from "../shared/services/presenceService";

const schema = z.object({
  userEmail: z.string().email(),
  newRole: z.enum(["Supervisor", "Admin", "Employee"]).nullable(),
});

/**
 * ChangeUserRole
 *
 * HTTP-triggered Azure Function to assign, update, or clear an Azure AD App Role
 * (“Admin”, “Supervisor”, “Employee”) for a given user. When `newRole` is `null`,
 * all roles are removed and the user’s record is deleted.
 *
 * Authorization: Caller must be authenticated as an Admin.
 *
 * Request JSON:
 * {
 *   "userEmail": "user@example.com",
 *   "newRole":  "Supervisor" | "Admin" | "Employee" | null
 * }
 *
 * Responses:
 * - 200 OK on success
 * - 400 Bad Request on validation or external API errors
 * - 401 Unauthorized if caller not authenticated
 * - 403 Forbidden if caller not an Admin
 */
const changeUserRole: AzureFunction = withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const callerAdId = (claims.oid || claims.sub) as string;
    if (!callerAdId) {
      return unauthorized(ctx, "Cannot determine caller identity");
    }

    const callerEmail = claims.preferred_username as string;
    const callerName  = claims.name as string;
    const caller = await findOrCreateAdmin(callerAdId, callerEmail, callerName);
    if (caller.deletedAt) {
      return unauthorized(ctx, "Caller has been deleted");
    }
    if (caller.role !== "Admin") {
      return forbidden(ctx, "Only Admin may change roles");
    }

    await withBodyValidation(schema)(ctx, async () => {
      const { userEmail, newRole } = ctx.bindings.validatedBody as {
        userEmail: string;
        newRole: "Supervisor" | "Admin" | "Employee" | null;
      };

      // Acquire Microsoft Graph token
      let graphToken: string;
      try {
        graphToken = await getGraphToken();
      } catch (err: any) {
        return badRequest(ctx, `Graph token error: ${err.message}`);
      }

      // Resolve Service Principal ID
      let spId = process.env.SERVICE_PRINCIPAL_OBJECT_ID;
      if (!spId) {
        const clientId = process.env.APP_CLIENT_ID || config.azureClientId;
        spId = await getServicePrincipalObjectId(graphToken, clientId);
      }

      // Resolve target user’s Azure AD object ID
      let targetAdId: string;
      try {
        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}?$select=id`,
          { headers: { Authorization: `Bearer ${graphToken}` } }
        );
        targetAdId = resp.data.id;
      } catch {
        const fallback = await axios.get(
          `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${userEmail}'&$select=id`,
          { headers: { Authorization: `Bearer ${graphToken}` } }
        );
        if (!fallback.data.value?.length) {
          return badRequest(ctx, `User ${userEmail} not found`);
        }
        targetAdId = fallback.data.value[0].id;
      }

      // Remove all existing App Roles in Azure AD
      await removeAllAppRolesFromUser(graphToken, spId!, targetAdId);

      // If clearing roles, delete the DB record and return
      if (newRole === null) {
        await deleteUserByEmail(userEmail);
        return ok(ctx, { message: `${userEmail} deleted` });
      }

      // Assign the requested App Role
      const roleIdMap: Record<string, string | undefined> = {
        Supervisor: process.env.SUPERVISORS_GROUP_ID,
        Admin:      process.env.ADMINS_GROUP_ID,
        Employee:   process.env.EMPLOYEES_GROUP_ID,
      };
      const roleId = roleIdMap[newRole]!;
      await assignAppRoleToPrincipal(graphToken, spId!, targetAdId, roleId);

      // Fetch the user’s displayName from Graph
      let displayName = "";
      try {
        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/users/${targetAdId}?$select=displayName`,
          { headers: { Authorization: `Bearer ${graphToken}` } }
        );
        displayName = resp.data.displayName || "";
      } catch {
        // ignore if Graph call fails
      }

      // Upsert user record in the database
      await upsertUserRole(userEmail, targetAdId, displayName, newRole, null);

      // If new role is Employee, initialize presence as offline
      if (newRole === "Employee") {
        await setUserOffline(userEmail);
      }

      return ok(ctx, { message: `${userEmail} role changed to ${newRole}` });
    });
  });
}, {
  genericMessage: "Internal Server Error in ChangeUserRole",
  showStackInDev: true,
});

export default changeUserRole;
