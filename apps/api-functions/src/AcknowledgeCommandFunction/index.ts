import { Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import { markCommandsDelivered } from "../shared/services/pendingCommandService";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Zod schema for AcknowledgeCommand request.
 *
 * @remarks
 * Body must be `{ ids: string[] }`, where each ID is a UUID of a PendingCommand.
 */
const schema = z.object({
  ids: z.array(z.string().uuid())
});

/**
 * AcknowledgeCommandFunction
 *
 * HTTP POST /api/AcknowledgeCommand
 *
 * Authenticates via Azure AD JWT.
 * Body must include `{ ids: string[] }` with PendingCommand IDs.
 * Marks the specified commands as delivered in the database.
 *
 * @param ctx - Azure Functions execution context containing HTTP request.
 * @returns Promise<void> - 200 OK with `{ updatedCount: number }` on success, or 4xx on error.
 * @throws Errors from markCommandsDelivered bubble up to the error handler.
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
    // Verify user exists and not deleted
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }
    // Validate request body
    await withBodyValidation(schema)(ctx, async () => {
      const { ids } = (ctx as any).bindings.validatedBody as { ids: string[] };
      try {
        const updatedCount = await markCommandsDelivered(ids);
        ok(ctx, { updatedCount });
      } catch (err: any) {
        ctx.log.error("AcknowledgeCommand error:", err);
        badRequest(ctx, `Failed to acknowledge commands: ${err.message}`);
      }

    });
  });
});
