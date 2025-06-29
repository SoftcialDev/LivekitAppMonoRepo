import { Context, HttpRequest } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, noContent, badRequest } from "../shared/utils/response";
import { getPendingCommandsForEmployee } from "../shared/services/pendingCommandService";
import { JwtPayload } from "jsonwebtoken";

/**
 * Azure Function: FetchPendingCommands
 *
 * HTTP GET /api/FetchPendingCommands
 *
 * Returns the single most recent un‐acknowledged camera command
 * for the authenticated employee, if it hasn’t expired.
 *
 * Commands older than PENDING_COMMAND_TTL_MINUTES (default 5) are treated as expired.
 * In that case, this function returns 204 No Content.
 *
 * Workflow:
 * 1. Validate JWT via `withAuth`, populating `ctx.bindings.user`.
 * 2. Extract Azure AD object ID (`oid` or `sub`) from token claims.
 * 3. Look up the corresponding User record and ensure it exists.
 * 4. Fetch all un‐acknowledged commands via `getPendingCommandsForEmployee`.
 * 5. Select the one with the latest `timestamp` (if any).
 * 6. If none, return `{ pending: null }`.
 * 7. If the latest is older than TTL, return 204 No Content.
 * 8. Otherwise return `{ pending: latest }`.
 *
 * @param ctx – Azure Functions execution context, containing the HTTP request.
 * @returns
 *   - 200 OK + `{ pending: PendingCommand | null }` when a valid command exists or none.
 *   - 204 No Content when the latest command is expired.
 *   - 401 Unauthorized if the token is invalid or the user is not found/deleted.
 *   - 400 Bad Request if fetching pending commands fails.
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

    // Lookup the user by Azure AD object ID
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }

    try {
      // Fetch all un‐acknowledged commands
      const pendingList = await getPendingCommandsForEmployee(user.id);

      // Select the most recent command, if exists
      const latest = pendingList.length > 0
        ? pendingList.reduce((prev, curr) =>
            curr.timestamp > prev.timestamp ? curr : prev
          )
        : null;

      if (!latest) {
        // no pending commands
        ok(ctx, { pending: null });
        return;
      }

      // Determine TTL from env (in minutes), default to 5
      const ttlMinutes = parseInt(process.env.PENDING_COMMAND_TTL_MINUTES || "5", 10);
      const ageMs = Date.now() - new Date(latest.timestamp).getTime();

      if (ageMs > ttlMinutes * 60 * 1000) {
        // command expired
        noContent(ctx);
        return;
      }

      // valid, return it
      ok(ctx, { pending: latest });
    } catch (err: any) {
      ctx.log.error("FetchPendingCommands error:", err);
      badRequest(ctx, `Failed to fetch pending commands: ${err.message}`);
    }
  });
});
