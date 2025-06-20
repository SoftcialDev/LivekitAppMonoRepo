import { Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../../middleware/auth";
import { withErrorHandler } from "../../middleware/errorHandler";
import { withBodyValidation } from "../../middleware/validate";
import { ok, unauthorized, badRequest } from "../../utils/response";
import prisma from "../../services/prismaClienService";
import { addUserToGroup } from "../../services/graphService";
import { config } from "../../config";
import { JwtPayload } from "jsonwebtoken";

/**
 * Zod schema for PromoteAdmin request.
 *
 * @remarks
 * Body must be `{ employeeEmail: string }`, where employeeEmail is a valid email.
 */
const schema = z.object({
  employeeEmail: z.string().email()
});

/**
 * PromoteAdminFunction
 *
 * HTTP POST /api/PromoteAdmin
 *
 * Authenticates via Azure AD JWT.
 * Only a user with role "SuperAdmin" may call.
 * Body: `{ employeeEmail }`.
 * - Finds the target user in the database by email.
 * - Calls Graph API to add the target to the Admins group.
 * - Updates the target user record: sets role="Admin", roleChangedAt to now, and adminId=null.
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
    // Validate caller identity
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
      unauthorized(ctx, "Only SuperAdmin can promote");
      return;
    }

    // Validate request body
    await withBodyValidation(schema)(ctx, async () => {
      const { employeeEmail } = (ctx as any).bindings.validatedBody as { employeeEmail: string };
      try {
        // Find target user record
        const target = await prisma.user.findUnique({
          where: { email: employeeEmail }
        });
        if (!target || target.deletedAt) {
          badRequest(ctx, "Target user not found or deleted");
          return;
        }
        if (!target.azureAdObjectId) {
          badRequest(ctx, "Target user missing Azure AD object ID");
          return;
        }
        // Call Graph API to add to Admin group
        await addUserToGroup(target.azureAdObjectId, config.adminsGroupId);
        // Update the user role in the database
        await prisma.user.update({
          where: { id: target.id },
          data: {
            role: "Admin",
            roleChangedAt: new Date(),
            adminId: null
          }
        });
        ok(ctx, { message: `${employeeEmail} promoted to Admin` });
      } catch (err: any) {
        ctx.log.error("PromoteAdmin error:", err);
        badRequest(ctx, `Failed to promote: ${err.message}`);
      }
    });
  });
});
