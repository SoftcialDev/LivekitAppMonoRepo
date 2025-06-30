import { Context, HttpRequest } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../shared/utils/response";
import type { JwtPayload } from "jsonwebtoken";

/**
 * Data Transfer Object for an active streaming session.
 *
 * @interface StreamingSessionDto
 * @property email     - The user's email address.
 * @property startedAt - ISO 8601 timestamp when the session started.
 * @property userId    - The user's database ID (used as LiveKit roomId).
 */
interface StreamingSessionDto {
  email:     string;
  startedAt: string;
  userId:    string;
}

/**
 * Azure Function to fetch all currently active streaming sessions.
 *
 * @remarks
 * - Authenticates the caller via `withAuth`.  
 * - Only succeeds if a valid JWT is provided.  
 * - Queries `streamingSessionHistory` for records with `stoppedAt = null`.  
 * - Includes each related user's `email` and `id` (used as `roomId`).  
 * - Returns `{ sessions: StreamingSessionDto[] }` on success.
 *
 * @param ctx - Azure Functions context containing the HTTP request.
 *
 * @returns A 200 OK with JSON `{ sessions: StreamingSessionDto[] }` on success.  
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
      const active = await prisma.streamingSessionHistory.findMany({
        where: { stoppedAt: null },
        include: {
          user: {
            select: {
              email: true,
              id:    true,  // this becomes the roomId
            },
          },
        },
      });

      const sessions: StreamingSessionDto[] = active.map(s => ({
        email:     s.user.email,
        startedAt: s.startedAt.toISOString(),
        userId:    s.user.id,
      }));

      ok(ctx, { sessions });
    } catch (err: any) {
      ctx.log.error("FetchStreamingSessions error:", err);
      badRequest(ctx, `Failed to fetch streaming sessions: ${err.message}`);
    }
  });
});
