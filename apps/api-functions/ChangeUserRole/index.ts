import { AzureFunction, Context } from "@azure/functions";
import { z } from "zod";
import axios from "axios";

import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest, forbidden } from "../shared/utils/response";

import {
  getGraphToken,
  getServicePrincipalObjectId,
  removeAllAppRolesFromPrincipalOnSp,
  assignAppRoleToPrincipal,
} from "../shared/services/graphService";
import { config } from "../shared/config";
import type { JwtPayload } from "jsonwebtoken";

import {
  findOrCreateAdmin,
  deleteUserByEmail,
  upsertUserRole,
  getUserByEmail,
} from "../shared/services/userService";
import { setUserOffline } from "../shared/services/presenceService";
import { logAudit, AuditAction } from "../shared/services/auditService";

const schema = z.object({
  userEmail: z.string().email(),
  newRole: z.enum(["Supervisor", "Admin", "Employee"]).nullable(),
});

/**
 * ChangeUserRole
 *
 * Authenticates an Admin or Supervisor caller, validates the request body,
 * updates the user's Azure AD app role, persists the change to the database
 * (creating the user record if it didn't exist), logs an audit entry,
 * and optionally marks the user offline.
 *
 * Supervisors may only assign the Employee role; Admins may assign any role
 * or remove a user (newRole=null).
 *
 * @param ctx - The Azure Functions execution context, including bindings and response helpers.
 * @returns A Promise that resolves to a HTTP response indicating the result of the operation.
 * @throws 401 Unauthorized when the caller’s identity cannot be determined or the caller is deleted.
 * @throws 403 Forbidden when the caller’s role is insufficient for the requested change.
 * @throws 400 BadRequest when Graph token retrieval fails or the target user cannot be found.
 */
const changeUserRole: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      const claims = (ctx as any).bindings.user as JwtPayload;
      const callerAdId = (claims.oid || claims.sub) as string;
      if (!callerAdId) {
        return unauthorized(ctx, "Cannot determine caller identity");
      }

      const callerEmail = claims.preferred_username as string;
      const callerName = claims.name as string;
      const caller = await findOrCreateAdmin(callerAdId, callerEmail, callerName);
      if (caller.deletedAt) {
        return unauthorized(ctx, "Caller has been deleted");
      }

      // Supervisors may only assign Employee; only Admin may do all others
      if (caller.role === "Supervisor") {
        await withBodyValidation(schema)(ctx, async () => {
          const { newRole } = ctx.bindings.validatedBody as {
            userEmail: string;
            newRole: "Supervisor" | "Admin" | "Employee" | null;
          };
          if (newRole !== "Employee") {
            return forbidden(ctx, "Supervisors may only assign Employee role");
          }
        });
      } else if (caller.role !== "Admin" && caller.role !== "SuperAdmin") {
        return forbidden(ctx, "Only Admin or Supervisor may change roles");
      }

      // From here on out, Admins handle full logic; Supervisors only reach this point
      // if they requested newRole="Employee"
      await withBodyValidation(schema)(ctx, async () => {
        const { userEmail, newRole } = ctx.bindings
          .validatedBody as {
          userEmail: string;
          newRole: "Supervisor" | "Admin" | "Employee" | null;
        };

        // fetch existing record, may be undefined
        const before = await getUserByEmail(userEmail);

        // get Graph token
        let graphToken: string;
        try {
          graphToken = await getGraphToken();
        } catch (err: any) {
          return badRequest(ctx, `Graph token error: ${err.message}`);
        }

        // resolve service principal ID
        let spId = process.env.SERVICE_PRINCIPAL_OBJECT_ID;
        if (!spId) {
          const clientId = process.env.APP_CLIENT_ID || config.azureClientId;
          spId = await getServicePrincipalObjectId(graphToken, clientId);
        }

        // resolve target AD object ID
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

        // remove existing app roles
        await removeAllAppRolesFromPrincipalOnSp(graphToken, spId!, targetAdId);

        // if newRole is null, delete only if record existed
        if (newRole === null) {
          if (before) {
            await deleteUserByEmail(userEmail);
            await logAudit({
              entity: "User",
              entityId: before.id,
              action: "DELETE" as AuditAction,
              changedById: caller.id,
              dataBefore: before,
            });
          }
          return ok(ctx, { message: `${userEmail} deleted` });
        }

        // assign new app-role
        const roleIdMap: Record<string, string> = {
          Supervisor: process.env.SUPERVISORS_GROUP_ID!,
          Admin: process.env.ADMINS_GROUP_ID!,
          Employee: process.env.EMPLOYEES_GROUP_ID!,
          ContactManager: process.env.CONTACT_MANAGER_GROUP_ID!,
        };
        const roleId = roleIdMap[newRole];
        await assignAppRoleToPrincipal(graphToken, spId!, targetAdId, roleId);

        // fetch displayName
        let displayName = "";
        try {
          const resp = await axios.get(
            `https://graph.microsoft.com/v1.0/users/${targetAdId}?$select=displayName`,
            { headers: { Authorization: `Bearer ${graphToken}` } }
          );
          displayName = resp.data.displayName || "";
        } catch {
          /* ignore */
        }

        // upsert in our DB
        const after: { id: string } | null = await upsertUserRole(
          userEmail,
          targetAdId,
          displayName,
          newRole,
        );

        await logAudit({
          entity: "User",
          entityId: after!.id,
          action: "ROLE_CHANGE" as AuditAction,
          changedById: caller.id,
          dataBefore: before,
          dataAfter: after,
        });

        if (newRole === "Employee") {
          await setUserOffline(userEmail);
        }

        return ok(ctx, {
          message: `${userEmail} role changed to ${newRole}`,
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in ChangeUserRole",
    showStackInDev: true,
  }
);

export default changeUserRole;
