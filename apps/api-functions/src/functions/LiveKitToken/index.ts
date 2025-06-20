import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../../middleware/auth";
import { withErrorHandler } from "../../middleware/errorHandler";
import { ok, badRequest, unauthorized } from "../../utils/response";
import { listRooms, generateToken } from "../../services/livekitService";
import prisma from "../../services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";

/**
 * LiveKitToken Function
 *
 * HTTP GET /api/LiveKitToken?room={roomId}
 *
 * - Authenticates via Azure AD JWT (populates ctx.bindings.user).
 * - Fetches the user record from database to check role.
 * - If role is Admin or SuperAdmin:
 *     • Lists all LiveKit rooms.
 *     • Issues a token with roomAdmin privileges.
 * - If role is Employee:
 *     • Issues a token with roomJoin privileges for their own room.
 *
 * Query Parameters:
 *   @param room?  string  ID of the room to join (optional; for Employee defaults to their own ID).
 *
 * Success Response (200 OK):
 *   {
 *     rooms: string[],
 *     accessToken: string
 *   }
 *
 * Error Responses:
 *   400 Bad Request   – missing/invalid parameters or user not in DB.
 *   401 Unauthorized  – missing/invalid token or insufficient privileges.
 *   500 Internal      – unexpected failure.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;

  // 1) Authenticate via Azure AD; populates ctx.bindings.user
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      badRequest(ctx, "Unable to determine user identity from token");
      return;
    }

    // 2) Fetch user from database
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }

    // 3) Determine role from DB record
    const role = user.role; // UserRole enum: "SuperAdmin" | "Admin" | "Employee"
    const isAdmin = role === "Admin" || role === "SuperAdmin";

    try {
      if (isAdmin) {
        // Admin or SuperAdmin flow: list all rooms + generate admin token
        const rooms = await listRooms();
        const token = await generateToken(azureAdId, true);
        ok(ctx, { rooms, accessToken: token });
      } else {
        // Employee flow: join only their own room
        const roomQuery = req.query.room as string | undefined;
        const room = roomQuery || azureAdId;
        const token = await generateToken(azureAdId, false, room);
        ok(ctx, { rooms: [room], accessToken: token });
      }
    } catch (err: any) {
      ctx.log.error("LiveKitToken error:", err);
      if (!isAdmin && err.message.includes("Employee must specify room")) {
        badRequest(ctx, err.message);
      } else {
        unauthorized(ctx, "Failed to generate LiveKit token or list rooms");
      }
    }
  });
});
