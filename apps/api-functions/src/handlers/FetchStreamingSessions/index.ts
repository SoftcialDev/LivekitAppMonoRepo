/**
 * @fileoverview FetchStreamingSessions - Azure Function for fetching streaming sessions
 * @summary Fetches all active streaming sessions based on user role
 * @description Provides endpoint for retrieving streaming sessions using DDD pattern
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { FetchStreamingSessionsApplicationService } from '../../application/services/FetchStreamingSessionsApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function to fetch all currently active streaming sessions.
 *
 * @remarks
 * - Authenticates the caller via `withAuth`.
 * - Uses `withCallerId` middleware to extract caller ID.
 * - Returns sessions based on user role:
 *   - Admin/SuperAdmin: All active sessions
 *   - Supervisor: Only sessions of their assigned PSOs
 * - Returns `{ sessions: StreamingSessionDto[] }` on success.
 *
 * @param ctx - Azure Functions context containing the HTTP request.
 * @returns A 200 OK with JSON `{ sessions: StreamingSessionDto[] }` on success.
 *          401 Unauthorized if no valid user identity.
 *          400 Bad Request on database or query failure.
 */
const fetchHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.StreamingSessionsRead)(ctx);
        serviceContainer.initialize();
        
        const applicationService = serviceContainer.resolve<FetchStreamingSessionsApplicationService>('FetchStreamingSessionsApplicationService');
        const callerId = ctx.bindings.callerId as string;
        
        const response = await applicationService.fetchStreamingSessions(callerId);
        
        ok(ctx, response.toPayload());
      });
    });
  },
  { genericMessage: "Failed to fetch streaming sessions" }
);

export default fetchHandler;
