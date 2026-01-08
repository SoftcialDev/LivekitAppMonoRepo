/**
 * @fileoverview GetTalkSessions - Azure Function for querying talk session history
 * @summary Retrieves all talk sessions with pagination
 * @description HTTP-triggered function that handles talk session queries with pagination
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok, badRequest } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetTalkSessionsApplicationService } from '../../application/services/GetTalkSessionsApplicationService';
import { GetTalkSessionsRequest } from '../../domain/value-objects/GetTalkSessionsRequest';
import { getTalkSessionsSchema } from '../../domain/schemas/GetTalkSessionsSchema';

/**
 * HTTP GET /api/talk-sessions
 *
 * Returns all talk sessions with pagination.
 * Only users with Admin or SuperAdmin roles may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are Admin or SuperAdmin.
 * 2. Supports query parameters for pagination: page, limit.
 * 3. Returns a paginated list of talk sessions with supervisor and PSO information.
 * 4. Use page and limit for pagination: ?page=1&limit=10 for first page, ?page=2&limit=10 for second page, etc.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response with talk sessions, or an error response
 */
const getTalkSessionsHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.TalkSessionsRead)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetTalkSessionsApplicationService>('GetTalkSessionsApplicationService');
        const callerId = ctx.bindings.callerId as string;

        const query = req.query || {};
        const validationResult = getTalkSessionsSchema.safeParse(query);

        if (!validationResult.success) {
          return badRequest(ctx, {
            message: 'Invalid query parameters',
            errors: validationResult.error.errors
          });
        }

        const request = GetTalkSessionsRequest.fromQuery(callerId, validationResult.data);
        const response = await applicationService.getTalkSessions(callerId, request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal error fetching talk sessions",
    showStackInDev: true,
  }
);

export default getTalkSessionsHandler;

