import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest, forbidden } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import axios from "axios";
import {
  getGraphToken,
  getServicePrincipalObjectId,
  removeAllAppRolesFromUser,
  assignAppRoleToPrincipal,
} from "../shared/services/graphService";
import { config } from "../shared/config";
import { JwtPayload } from "jsonwebtoken";

const schema = z.object({
  userEmail: z.string().email(),
  newRole: z.enum(["Supervisor", "Admin", "Employee"]).nullable(),
});

/**
 * changeUserRole
 *
 * Azure Function to assign, update, or clear an Azure AD App Role (Admin, Supervisor, Employee)
 * for a given user based on their email address. If `newRole` is `null`, the function will:
 * - Remove all app roles from the user in Azure AD
 * - Delete the user from the database
 * 
 * If `newRole` is one of the valid roles, it will:
 * - Remove all previous roles
 * - Assign the new role using Microsoft Graph API
 * - Upsert the user in the local database with the new role and display name
 * 
 * ### Authorization:
 * The caller must be authenticated via Azure AD JWT and have the "Admin" role.
 *
 * ### Input JSON Schema:
 * ```json
 * {
 *   "userEmail": "user@example.com",
 *   "newRole": "Admin" | "Supervisor" | "Employee" | null
 * }
 * ```
 *
 * @param ctx - Azure Function execution context
 *   - ctx.req.body must contain `userEmail` and `newRole`
 *   - ctx.bindings.user must contain a valid JWT payload (injected by `withAuth`)
 *
 * @returns
 * - `200 OK`: Role updated or cleared successfully
 * - `400 Bad Request`: Invalid input or environment config, or operation failure
 * - `401 Unauthorized`: Caller is not authenticated or has been deleted
 * - `403 Forbidden`: Caller is not an Admin
 * - `502 Bad Gateway`: Microsoft Graph API error or external service failure
 *
 * @example
 * POST /api/ChangeUserRole
 * Authorization: Bearer {token}
 * Body:
 * {
 *   "userEmail": "alice@company.com",
 *   "newRole": "Supervisor"
 * }
 */
const changeUserRole: AzureFunction = withErrorHandler(async (ctx: Context) => {
  const req = ctx.req!;

  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const callerAdId = (claims.oid || claims.sub) as string;
    if (!callerAdId) return unauthorized(ctx, "Cannot determine caller");

    let caller = await prisma.user.findUnique({ where: { azureAdObjectId: callerAdId } });
    if (!caller) {
      caller = await prisma.user.create({
        data: {
          azureAdObjectId: callerAdId,
          email: claims.preferred_username as string,
          fullName: claims.name as string,
          role: "Admin",
          roleChangedAt: new Date(),
          supervisorId: null,
        },
      });
    }
    if (caller.deletedAt) return unauthorized(ctx, "Caller deleted");
    if (caller.role !== "Admin") return forbidden(ctx, "Only Admin may change roles");

    await withBodyValidation(schema)(ctx, async () => {
      const { userEmail, newRole } = ctx.bindings.validatedBody as {
        userEmail: string;
        newRole: "Supervisor" | "Admin" | "Employee" | null;
      };

      let token: string;
      try {
        token = await getGraphToken();
      } catch (err: any) {
        return badRequest(ctx, `Graph token error: ${err.message}`);
      }

      let spId = process.env.SERVICE_PRINCIPAL_OBJECT_ID;
      const clientId = process.env.APP_CLIENT_ID || config.azureClientId;
      if (!spId) {
        if (!clientId) return badRequest(ctx, "Missing APP_CLIENT_ID");
        try {
          spId = await getServicePrincipalObjectId(token, clientId);
        } catch (err: any) {
          return badRequest(ctx, `SP ID resolution failed: ${err.message}`);
        }
      }

      let targetAdId: string;
      try {
        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}?$select=id`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        targetAdId = resp.data.id;
      } catch {
        try {
          const list1 = await axios.get(
            `https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${userEmail}'&$select=id`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (list1.data.value.length > 0) {
            targetAdId = list1.data.value[0].id;
          } else throw new Error("not found");
        } catch {
          try {
            const list2 = await axios.get(
              `https://graph.microsoft.com/v1.0/users?$filter=mail eq '${userEmail}'&$select=id`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (list2.data.value.length > 0) {
              targetAdId = list2.data.value[0].id;
            } else {
              throw new Error(`User ${userEmail} not found`);
            }
          } catch (err: any) {
            return badRequest(ctx, `Failed to resolve AD object ID: ${err.message}`);
          }
        }
      }

      try {
        await removeAllAppRolesFromUser(token, spId!, targetAdId);
      } catch (err: any) {
        return badRequest(ctx, `Failed to clear roles: ${err.message}`);
      }

      if (newRole === null) {
        try {
          await prisma.user.delete({ where: { email: userEmail } });
        } catch (err: any) {
          return badRequest(ctx, `Failed to delete DB record: ${err.message}`);
        }
        return ok(ctx, { message: `${userEmail} roles cleared and record deleted` });
      }

      const envMap: Record<string, string | undefined> = {
        Supervisor: process.env.SUPERVISORS_GROUP_ID,
        Admin: process.env.ADMINS_GROUP_ID,
        Employee: process.env.EMPLOYEES_GROUP_ID,
      };
      const newRoleId = envMap[newRole];
      if (!newRoleId) {
        return badRequest(ctx, `Missing App Role ID for ${newRole}`);
      }
      try {
        await assignAppRoleToPrincipal(token, spId!, targetAdId, newRoleId);
      } catch (err: any) {
        return badRequest(ctx, `Failed to assign role: ${err.message}`);
      }

      let displayName = "";
      try {
        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/users/${targetAdId}?$select=displayName`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        displayName = resp.data.displayName || "";
      } catch {
        /* ignore—guest always has displayName */
      }

      try {
        await prisma.user.upsert({
          where: { email: userEmail },
          create: {
            email: userEmail,
            azureAdObjectId: targetAdId,
            fullName: displayName,
            role: newRole,
            roleChangedAt: new Date(),
            supervisorId: null,
          },
          update: {
            fullName: displayName,
            role: newRole,
            roleChangedAt: new Date(),
            supervisorId: null,
          },
        });
      } catch (err: any) {
        return badRequest(ctx, `DB error: ${err.message}`);
      }

      return ok(ctx, { message: `${userEmail} role changed to ${newRole}` });
    });
  });
}, {
  genericMessage: "Internal Server Error in ChangeUserRole",
  showStackInDev: true
});

export default changeUserRole;
