/**
 * @fileoverview GetWebsocketPresenceStatus - Azure Function for getting paginated presence status
 * @summary HTTP handler for presence status endpoint
 * @description Returns a paginated list of presence statuses for all users, including supervisor info
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok, badRequest, unauthorized } from '../../utils/response';
import prisma from '../../infrastructure/database/PrismaClientService';
import { getCallerAdId } from '../../utils/authHelpers';
import { getWebsocketPresenceStatusSchema } from '../../domain/schemas/GetWebsocketPresenceStatusSchema';
import { PresenceItem, PaginatedPresence } from '../../domain/types/PresenceTypes';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * HTTP GET /api/GetWebsocketPresenceStatus
 *
 * Returns a paginated list of presence statuses for all users, including each user's supervisor info.
 *
 * - **Admin** callers see all users.
 * - **Supervisor** callers see only their direct reports on the client side,
 *   but this endpoint returns everyone.
 *
 * Query parameters:
 * - page: Page number (1-based, default: 1)
 * - pageSize: Items per page (default: 50, max: 100)
 *
 * @param ctx - Azure Functions execution context
 * @param req - HTTP request with optional `page` and `pageSize` query params
 * @returns 200 OK with PaginatedPresence, or 4xx on error
 */
const getWebsocketPresenceStatuses: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await requirePermission(Permission.StreamingStatusRead)(ctx);

      const extendedCtx = ensureBindings(ctx);
      if (!extendedCtx.bindings.user) {
        return unauthorized(ctx, "Unable to determine caller identity: user not found in context");
      }
      
      const callerId = getCallerAdId(extendedCtx.bindings.user);
      if (!callerId) {
        return unauthorized(ctx, "Unable to determine caller identity");
      }

      const caller = await prisma.user.findUnique({
        where: { azureAdObjectId: callerId },
      });
      if (!caller || caller.deletedAt) {
        return unauthorized(ctx, "Caller not found or deleted");
      }

      const parseResult = getWebsocketPresenceStatusSchema.safeParse(req.query);
      if (!parseResult.success) {
        return badRequest(
          ctx,
          "Invalid query parameters: page and pageSize must be positive integers"
        );
      }

      const { page = "1", pageSize = "50" } = parseResult.data;
      const p = Math.max(1, parseInt(page, 10));
      const size = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

      const total = await prisma.user.count({
        where: { deletedAt: null },
      });

      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        skip: (p - 1) * size,
        take: size,
        orderBy: { email: "asc" },
        select: {
          email: true,
          fullName: true,
          azureAdObjectId: true,
          role: true,
          presence: {
            select: { status: true, lastSeenAt: true },
          },
          supervisor: {
            select: { id: true, email: true, fullName: true },
          },
        },
      });

      const items: PresenceItem[] = users.map((u) => ({
        email: u.email,
        fullName: u.fullName ?? "",
        azureAdObjectId: u.azureAdObjectId,
        role: u.role,
        status: u.presence?.status ?? "offline",
        lastSeenAt: u.presence?.lastSeenAt?.toISOString() ?? null,
        supervisorEmail: u.supervisor?.email ?? null,
        supervisorName: u.supervisor?.fullName ?? null,
        supervisorId: u.supervisor?.id ?? null,
      }));

      const response: PaginatedPresence = {
        total,
        page: p,
        pageSize: size,
        items,
      };

      return ok(ctx, response);
    });
  },
  {
    genericMessage: "Internal error fetching presence statuses",
    showStackInDev: true,
  }
);

export default getWebsocketPresenceStatuses;
