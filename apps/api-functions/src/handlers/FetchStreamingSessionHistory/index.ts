/**
 * @fileoverview FetchStreamingSessionHistory - Azure Function for fetching streaming session history
 * @summary Fetches the most recent streaming session for the authenticated user
 * @description Provides endpoint for retrieving streaming session history using DDD pattern
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok, noContent } from '../../utils/response';
import { FetchStreamingSessionHistoryApplicationService } from '../../application/services/FetchStreamingSessionHistoryApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function to fetch the most recent streaming session history
 * for the currently authenticated user.
 *
 * @remarks
 * - Authenticates the caller via `withAuth`.
 * - Uses `withCallerId` middleware to extract caller ID.
 * - Returns the most recent session (active or stopped) for the user.
 * - Returns `{ session: StreamingSessionHistoryDto | null }` on success.
 *
 * @param ctx - Azure Functions context containing the HTTP request.
 * @returns A 200 OK with JSON `{ session: StreamingSessionHistoryDto | null }` on success.
 *          401 Unauthorized if no valid user identity.
 *          400 Bad Request on database or query failure.
 */
const fetchHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.StreamingSessionsReadHistory)(ctx);
        serviceContainer.initialize();
        
        const applicationService = serviceContainer.resolve<FetchStreamingSessionHistoryApplicationService>('FetchStreamingSessionHistoryApplicationService');
        const callerId = ctx.bindings.callerId as string;
        
        const response = await applicationService.fetchStreamingSessionHistory(callerId);
        
        if (response.session) {
          ok(ctx, response.toPayload());
        } else {
          noContent(ctx);
        }
      });
    });
  },
  { genericMessage: "Failed to fetch streaming session history" }
);

export default fetchHandler;
