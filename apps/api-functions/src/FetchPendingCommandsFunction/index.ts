import { Context, HttpRequest } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import { getPendingCommandsForEmployee } from "../shared/services/pendingCommandService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Azure Function: FetchPendingCommands
 *
 * HTTP GET /api/FetchPendingCommands
 *
 * Returns the single most recent un-acknowledged camera command
 * for the authenticated employee (or null if none).
 *
 * Workflow:
 * 1. Validate JWT via `withAuth`, populating `ctx.bindings.user`.
 * 2. Extract Azure AD object ID (`oid` or `sub`) from token claims.
 * 3. Look up the corresponding User record and ensure it exists.
 * 4. Call `getPendingCommandsForEmployee(user.id)` to fetch all un-acknowledged commands.
 * 5. Select the one with the latest `timestamp` (if any) and return it.
 *
 * @param ctx - Azure Functions execution context, containing the HTTP request.
 * @returns 200 OK with JSON `{ pending: PendingCommand | null }` on success.
 * @throws 401 Unauthorized if the token is invalid or the user is not found/deleted.
 * @throws 400 Bad Request if fetching pending commands fails.
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

    // 2) Lookup the user by Azure AD object ID
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }

    try {
      // 3) Fetch all un-acknowledged commands
      const pendingList = await getPendingCommandsForEmployee(user.id);

      // 4) Select the most recent command, if existe
      const latest = pendingList.length > 0
        ? pendingList.reduce((prev, curr) =>
            curr.timestamp > prev.timestamp ? curr : prev
          )
        : null;

      ok(ctx, { pending: latest });
    } catch (err: any) {
      ctx.log.error("FetchPendingCommands error:", err);
      badRequest(ctx, `Failed to fetch pending commands: ${err.message}`);
    }
  });
});
