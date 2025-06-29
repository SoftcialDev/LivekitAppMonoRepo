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
 * Azure Function handler for generating LiveKit access tokens and room listings,
 * now using database PK (user.id) as the room identifier.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      return badRequest(ctx, 'Unable to determine caller identity');
    }

    // Load caller from DB
    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
      select: { id: true, role: true, deletedAt: true },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, 'Caller not found or deleted');
    }

    // Use database PK as room identifier
    const userId = caller.id;
    const isAdminOrSup = caller.role === 'Admin' || caller.role === 'Supervisor';

    // Ensure the caller's personal room exists (named by userId)
    await ensureRoom(userId);

    // Determine which rooms to include
    let roomNames: string[];
    if (isAdminOrSup) {
      // listRooms returns array of existing room names
      roomNames = (await listRooms()).filter(r => r !== userId);
    } else {
      roomNames = [userId];
    }

    // Generate a token per room, using userId as the identity in the JWT
    const roomsWithTokens = await Promise.all(
      roomNames.map(async (room) => {
        const token = await generateToken(
          userId,          // identity claim = database PK
          isAdminOrSup,
          room,            // room name = either other user IDs or own userId
        );
        return { room, token };
      })
    );

    // Return the list of rooms and the WebSocket URL
    return ok(ctx, {
      rooms:      roomsWithTokens,
      livekitUrl: config.livekitApiUrl,
    });
  });
});
