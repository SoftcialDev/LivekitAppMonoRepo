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
 * @property {string} email     The user's email address.
 * @property {string} startedAt ISO 8601 timestamp when the session started.
 * @property {string} userId    The user's ID (este será tu roomId).
 */
interface StreamingSessionDto {
  email:    string;
  startedAt: string;
  userId:   string;
}

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
              id:    true,               // <— incluimos el ID
              // azureAdObjectId: true,   // si lo necesitas en lugar de “id”
            },
          },
        },
      });

      const sessions: StreamingSessionDto[] = active.map(s => ({
        email:     s.user.email,
        startedAt: s.startedAt.toISOString(),
        userId:    s.user.id,         // <— aquí asignas el id para usarlo como roomId
      }));

      ok(ctx, { sessions });
    } catch (err: any) {
      ctx.log.error("FetchStreamingSessions error:", err);
      badRequest(ctx, `Failed to fetch streaming sessions: ${err.message}`);
    }
  });
});
