import { Context } from '@azure/functions';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ok, badRequest, unauthorized } from '../shared/utils/response';
import {
  listRooms,
  ensureRoom,
  generateToken,
} from '../shared/services/livekitService';
import prisma from '../shared/services/prismaClienService';
import { JwtPayload } from 'jsonwebtoken';
import { config } from '../shared/config/index';

/**
 * Azure Function handler for generating LiveKit access tokens and room listings.
 *
 * - **Employee**:
 *   - Ensures the caller's personal room exists
 *   - Returns a single entry in `rooms` with their own room and token
 *
 * - **Admin / Supervisor**:
 *   - Ensures the caller’s own room exists
 *   - Lists all other existing rooms (excluding empty rooms and the caller’s own)
 *   - Returns one token per room in `rooms`
 *
 * The response payload will be:
 * ```json
 * {
 *   "rooms": [
 *     { "room": "roomA-id", "token": "ey..." },
 *     { "room": "roomB-id", "token": "ey..." },
 *     …
 *   ],
 *   "livekitUrl": "wss://your.livekit.server"
 * }
 * ```
 *
 * @param ctx - Azure Functions execution context, augmented with `bindings.user` JWT claims
 * @returns A Promise that resolves to an HTTP response via the provided context
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      return badRequest(ctx, 'Unable to determine caller identity');
    }

    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, 'Caller not found or deleted');
    }

    const isAdminOrSup = caller.role === 'Admin' || caller.role === 'Supervisor';

    // 1) Always ensure the caller’s own room exists
    await ensureRoom(azureAdId);

    // 2) Determine which room names to use
    let roomNames: string[];
    if (isAdminOrSup) {
      roomNames = (await listRooms())
        .filter(r => r && r !== azureAdId);
    } else {
      roomNames = [azureAdId];
    }

    // 3) Generate one token per room
    const roomsWithTokens = await Promise.all(
      roomNames.map(async (room) => {
        const token = await generateToken(
          azureAdId,
          isAdminOrSup,
          room,
        );
        return { room, token };
      })
    );

    // 4) Return payload
    return ok(ctx, {
      rooms:      roomsWithTokens,
      livekitUrl: config.livekitApiUrl,
    });
  });
});
