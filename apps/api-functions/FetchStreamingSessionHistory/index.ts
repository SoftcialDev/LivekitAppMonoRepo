import { Context, HttpRequest } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import type { JwtPayload } from "jsonwebtoken";

/**
 * Data Transfer Object for streaming session history.
 */
interface StreamingSessionHistoryDto {
  id: string;
  userId: string;
  startedAt: string;
  stoppedAt: string | null;
  stopReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Azure Function to fetch the most recent streaming session history
 * for the currently authenticated user.
 *
 * @remarks
 * - Authenticates the caller via `withAuth`.
 * - Only succeeds if a valid JWT is provided.
 * - Returns the most recent session (active or stopped) for the user.
 * - Returns `{ session: StreamingSessionHistoryDto | null }` on success.
 *
 * @param ctx - Azure Functions context containing the HTTP request.
 * @returns A 200 OK with JSON `{ session: StreamingSessionHistoryDto | null }` on success.
 *          401 Unauthorized if no valid user identity.
 *          400 Bad Request on database or query failure.
 */
export default withErrorHandler(async (ctx: Context): Promise<void> => {
  const req: HttpRequest = ctx.req!;

  await withAuth(ctx, async () => {
    const claims = ctx.bindings.user as JwtPayload;
    const azureAdId = (claims.oid ?? claims.sub) as string | undefined;
    if (!azureAdId) {
      return unauthorized(ctx, "Cannot determine user identity");
    }

    try {
      // Find the user by Azure AD Object ID
      const user = await prisma.user.findUnique({
        where: { azureAdObjectId: azureAdId },
        select: { id: true }
      });

      if (!user) {
        ctx.log.warn(`User not found for Azure AD ID: ${azureAdId}`);
        ok(ctx, { session: null });
        return;
      }

      // Get the most recent session for this user
      const latestSession = await prisma.streamingSessionHistory.findFirst({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' }
      });

      if (!latestSession) {
        ctx.log.info(`No streaming session history found for user ${azureAdId}`);
        ok(ctx, { session: null });
        return;
      }

      const session: StreamingSessionHistoryDto = {
        id: latestSession.id,
        userId: latestSession.userId,
        startedAt: latestSession.startedAt.toISOString(),
        stoppedAt: latestSession.stoppedAt?.toISOString() || null,
        stopReason: latestSession.stopReason,
        createdAt: latestSession.createdAt.toISOString(),
        updatedAt: latestSession.updatedAt.toISOString()
      };

      ctx.log.info(`Found latest session for user ${azureAdId}: ${session.id} (stopReason: ${session.stopReason})`);
      ok(ctx, { session });
    } catch (err: any) {
      ctx.log.error("FetchStreamingSessionHistory error:", err);
      throw err;
    }
  });
});
