import { Context, HttpRequest } from "@azure/functions";
import { z } from "zod";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import { markCommandsDelivered } from "../shared/services/pendingCommandService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Zod schema for AcknowledgeCommand request.
 *
 * @remarks
 * Body must be `{ ids: string[] }`, where each ID is the UUID of a PendingCommand
 * that the client has processed and now acknowledges.
 */
const schema = z.object({
  ids: z.array(z.string().uuid())
});

/**
 * Azure Function: AcknowledgeCommandFunction
 *
 * HTTP POST /api/AcknowledgeCommand
 *
 * Allows the authenticated Employee to acknowledge receipt and processing
 * of one or more pending camera commands. Marks each specified PendingCommand
 * record as acknowledged in the database.
 *
 * Workflow:
 * 1. Validate JWT via `withAuth`, populating `ctx.bindings.user`.
 * 2. Extract Azure AD object ID (`oid` or `sub`) from token claims.
 * 3. Load User record; ensure it exists, is not deleted, and has role `Employee`.
 * 4. Validate request body against Zod schema.
 * 5. Call `markCommandsDelivered(ids)` to update `acknowledged = true` and
 *    set `acknowledgedAt = now()` on each record.
 * 6. Return `{ updatedCount: number }` indicating how many rows were updated.
 *
 * @param ctx - Azure Function execution context.
 * @returns 200 OK with `{ updatedCount: number }` if successful.
 * @throws 401 Unauthorized if:
 *   - JWT is missing or invalid
 *   - User not found, deleted, or not an Employee
 * @throws 400 Bad Request if validation or database update fails.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;

  await withAuth(ctx, async () => {
    const claims = ctx.bindings.user as JwtPayload;
    const azureAdId = (claims.oid ?? claims.sub) as string | undefined;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine user identity");
      return;
    }

    // 2) Load user and enforce Employee role
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }
    if (user.role !== "Employee") {
      unauthorized(ctx, "Only employees may acknowledge commands");
      return;
    }

    // 3) Validate request body
    await withBodyValidation(schema)(ctx, async () => {
      const { ids } = ctx.bindings.validatedBody as { ids: string[] };

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
