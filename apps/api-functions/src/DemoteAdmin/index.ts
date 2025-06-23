import { Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import prisma from "../shared/services/prismaClienService";
import { removeUserFromGroup } from "../shared/services/graphService";
import { config } from "../shared/config/index";
import { JwtPayload } from "jsonwebtoken";

/**
 * Zod schema for DemoteAdmin request.
 *
 * @remarks
 * Body must be `{ adminEmail: string }`, where adminEmail is a valid email.
 */
const schema = z.object({
  adminEmail: z.string().email()
});

/**
 * DemoteAdminFunction
 *
 * HTTP POST /api/DemoteAdmin
 *
 * Authenticates via Azure AD JWT.
 * Only a user with role "SuperAdmin" may call.
 * Body: `{ adminEmail }`.
 * - Finds the target user in the database by email.
 * - Calls Graph API to remove the target from the Admins group.
 * - Updates the target user record: sets role="Employee", roleChangedAt to now, and adminId=null.
 *
 * Success: responds 200 OK with `{ message: string }`.
 * Errors:
 *  - 400 Bad Request: invalid body, target not found, or update failure.
 *  - 401 Unauthorized: missing/invalid token, caller not found, or insufficient privileges.
 *
 * @param ctx - Azure Functions execution context containing HTTP request.
 * @returns Promise<void> - 200 OK on success or appropriate error response.
 * @throws Errors from Graph API or database operations bubble up to the error handler.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine user identity");
      return;
    }
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!caller || caller.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }
    if (caller.role !== "SuperAdmin") {
      unauthorized(ctx, "Only SuperAdmin can demote");
      return;
    }

    await withBodyValidation(schema)(ctx, async () => {
      const { adminEmail } = (ctx as any).bindings.validatedBody as { adminEmail: string };
      try {
        const target = await prisma.user.findUnique({
          where: { email: adminEmail }
        });
        if (!target || target.deletedAt) {
          badRequest(ctx, "Target user not found or deleted");
          return;
        }
        if (target.role !== "Admin") {
          badRequest(ctx, "Target is not an Admin");
          return;
        }
        if (!target.azureAdObjectId) {
          badRequest(ctx, "Target user missing Azure AD object ID");
          return;
        }
        await removeUserFromGroup(target.azureAdObjectId, config.adminsGroupId);
        await prisma.user.update({
          where: { id: target.id },
          data: {
            role: "Employee",
            roleChangedAt: new Date(),
            adminId: null
          }
        });
        ok(ctx, { message: `${adminEmail} demoted to Employee` });
      } catch (err: any) {
        ctx.log.error("DemoteAdmin error:", err);
        badRequest(ctx, `Failed to demote: ${err.message}`);
      }
    });
  });
});
