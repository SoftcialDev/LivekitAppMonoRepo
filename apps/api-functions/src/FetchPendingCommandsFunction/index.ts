import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import { getPendingCommandsForEmployee } from "../shared/services/pendingCommandService";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * FetchPendingCommandsFunction
 *
 * HTTP GET /api/FetchPendingCommands
 *
 * Authenticates via Azure AD JWT.
 * Retrieves all pending commands (delivered=false) for the authenticated user.
 *
 * @param ctx - Azure Functions execution context containing HTTP request.
 * @returns Promise<void> - 200 OK with { pending: PendingCommand[] } on success,
 *   or 4xx/5xx on error.
 * @throws Errors from pendingCommandService bubble up to the error handler.
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
    // Fetch user record to obtain email
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }
    try {
      const pending = await getPendingCommandsForEmployee(user.email);
      ok(ctx, { pending });
    } catch (err: any) {
      ctx.log.error("FetchPendingCommands error:", err);
      badRequest(ctx, `Failed to fetch pending commands: ${err.message}`);
    }
  });
});
