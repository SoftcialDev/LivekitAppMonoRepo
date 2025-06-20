import { Context } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../../middleware/auth";
import { withErrorHandler } from "../../middleware/errorHandler";
import { withBodyValidation } from "../../middleware/validate";
import { ok, badRequest, unauthorized } from "../../utils/response";
import { sendAdminCommand } from "../../services/busService";
import prisma from "../../services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

const schema = z.object({
  command: z.enum(["START", "STOP"]),
  employeeEmail: z.string().email()
});

/**
 * Handler for the AdminCommand HTTP endpoint.
 *
 * Authenticates via Azure AD, validates that the caller has Admin or SuperAdmin role,
 * validates request body, and publishes a START or STOP command for a given employee.
 *
 * @param ctx - Azure Functions execution context, including bindings for HTTP and auth.
 * @returns A promise that resolves when the request has been handled.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine user identity");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }
    const role = user.role;
    const isAdmin = role === "Admin" || role === "SuperAdmin";
    if (!isAdmin) {
      unauthorized(ctx, "Insufficient privileges");
      return;
    }

    await withBodyValidation(schema)(ctx, async () => {
      const { command, employeeEmail } = (ctx as any).bindings.validatedBody;
      try {
        await sendAdminCommand(command, employeeEmail);
        ok(ctx, { message: `Command "${command}" sent to ${employeeEmail}` });
      } catch (err: any) {
        ctx.log.error("Failed to send admin command:", err);
        badRequest(ctx, "Unable to publish command");
      }
    });
  });
});
