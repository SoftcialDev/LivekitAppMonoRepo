import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, unauthorized } from "../shared/utils/response";
import { listRooms, generateToken } from "../shared/services/livekitService";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * LiveKitToken
 *
 * Azure Function to issue LiveKit access tokens based on the caller's role.
 *
 * ### HTTP Endpoint
 * `GET /api/LiveKitToken?room={roomId}`
 *
 * ### Authentication
 * Requires an Azure AD JWT. The caller must exist in the database.
 *
 * ### Role-based Behavior
 * - **Admin / Supervisor**:
 *   - Lists all current LiveKit rooms.
 *   - Fetches their direct reports (`Employee` users).
 *   - Filters rooms to those matching report emails.
 *   - Issues a token with `roomAdmin` privileges.
 *
 * - **Employee**:
 *   - Token is scoped to their own room (user’s Azure AD ID).
 *   - Optionally, they may join a specific room via `?room=xyz`.
 *   - Issues a token with `roomJoin` privileges.
 *
 * ### Query Parameters
 * @param room Optional room name override (Employee only).
 *
 * ### Success Response – 200 OK
 * ```json
 * {
 *   "rooms": ["room1", "room2"],
 *   "accessToken": "..."  // JWT from LiveKit
 * }
 * ```
 *
 * ### Error Responses
 * - `400 Bad Request`: Missing or invalid token claims.
 * - `401 Unauthorized`: Caller not found or deleted.
 * - `500 Internal`: Token generation or service failure.
 *
 * @param ctx - Azure Functions context object
 * @returns 200 OK with access token and room list, or relevant error response.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;

  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      badRequest(ctx, "Unable to determine user identity from token");
      return;
    }

    // 1) Fetch caller from database
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
    });
    if (!caller || caller.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }

    const isAdmin = caller.role === "Admin" || caller.role === "Supervisor";

    try {
      if (isAdmin) {
        // 2a) Admin/Supervisor: list only rooms matching their employees' emails
        const allRooms = await listRooms();

        // fetch direct-report emails
        const reports = await prisma.user.findMany({
          where: { supervisorId: caller.id, deletedAt: null, role: "Employee" },
          select: { email: true }
        });
        const reportEmails = new Set(reports.map(r => r.email.toLowerCase()));

        // filter rooms by email match (case-insensitive)
        const rooms = allRooms.filter(r =>
          reportEmails.has(r.toLowerCase())
        );

        const token = await generateToken(azureAdId, true);
        ok(ctx, { rooms, accessToken: token });

      } else {
        // 2b) Employee: join own room or specified override
        const roomQuery = req.query.room as string | undefined;
        const room = roomQuery || azureAdId;
        const token = await generateToken(azureAdId, false, room);
        ok(ctx, { rooms: [room], accessToken: token });
      }
    } catch (err: any) {
      ctx.log.error("LiveKitToken error:", err);
      unauthorized(ctx, "Failed to generate LiveKit token or list rooms");
    }
  });
});
