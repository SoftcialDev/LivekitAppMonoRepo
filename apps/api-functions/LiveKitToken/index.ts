import { Context } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest, unauthorized } from "../shared/utils/response";
import {
  listRooms,
  ensureRoom,
  generateToken,
} from "../shared/services/livekitService";
import prisma from "../shared/services/prismaClienService";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../shared/config/index";

/**
 * HTTP trigger for issuing LiveKit access tokens.
 *
 * Supports two modes:
 *  - **Employee**: returns a single `{ room, token }` for their personal room.
 *  - **Admin/Supervisor**: by default, returns one entry per other user’s room.
 *    If the optional `?userId=` query is provided, returns only that room.
 *
 * @remarks
 * - **Endpoint**: `GET /api/LiveKitToken[?userId=<roomId>]`
 * - **Auth**: Azure AD JWT in Authorization header
 *
 * @param ctx - Azure Functions context, includes:
 *   - `ctx.req.query.userId` (optional): database PK of the room to target
 *   - `ctx.bindings.user`: populated by `withAuth()`
 *
 * @returns 200 OK with JSON:
 * ```json
 * {
 *   "rooms": [ { "room": string, "token": string }, … ],
 *   "livekitUrl": string
 * }
 * ```
 * or 400/401 on error.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      return badRequest(ctx, "Unable to determine caller identity");
    }

    // Load caller from DB
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
      select: { id: true, role: true, deletedAt: true },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, "Caller not found or deleted");
    }

    const userId = caller.id;
    const isAdminOrSup =
      caller.role === "Admin" || caller.role === "Supervisor" || caller.role === "SuperAdmin";

    // Ensure personal room exists
    await ensureRoom(userId);

    // Read optional target room from query
    const targetRoom = (ctx.req?.query?.userId as string | undefined)?.trim();

    // Determine which rooms to return:
    // - Employee always gets their own.
    // - Admin/Supervisor:
    //    • if ?userId provided → only that room
    //    • otherwise → all other rooms
    let roomNames: string[];
    if (!isAdminOrSup) {
      roomNames = [userId];
    } else if (targetRoom) {
      roomNames = [targetRoom];
    } else {
      roomNames = (await listRooms()).filter((r) => r !== userId);
    }

    // Generate tokens
    const roomsWithTokens = await Promise.all(
      roomNames.map(async (room) => {
        // identity claim = caller.userId
        const token = await generateToken(userId, isAdminOrSup, room);
        return { room, token };
      })
    );

    // Return JSON payload
    return ok(ctx, {
      rooms: roomsWithTokens,
      livekitUrl: config.livekitApiUrl,
    });
  });
});
