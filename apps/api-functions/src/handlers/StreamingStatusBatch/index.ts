/**
 * @fileoverview StreamingStatusBatch - Azure Function for batch streaming status queries
 * @summary Fetches streaming status for multiple users in a single request
 * @description Provides endpoint for retrieving batch streaming status using DDD pattern
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { badRequest } from '../../utils/response';
import { StreamingStatusBatchApplicationService } from '../../application/services/StreamingStatusBatchApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { validateEmailArray } from '../../domain/schemas';

/**
 * Azure Function to fetch streaming status for multiple users in batch
 * 
 * @remarks
 * - Authenticates the caller via `withAuth` middleware
 * - Uses `withCallerId` middleware to extract caller ID from JWT token
 * - Validates email array using schema validation
 * - Returns streaming status for all requested emails in single response
 * - Uses optimized SQL query with DISTINCT ON for performance
 * - Supports up to 1000 emails per request
 *
 * @param ctx - Azure Functions context containing the HTTP request
 * @returns A 200 OK with JSON `{ statuses: Array<{email, hasActiveSession, lastSession}> }` on success
 *          401 Unauthorized if no valid user identity
 *          400 Bad Request on invalid input, validation failure, or database error
 * 
 * @example
 * Request: POST /api/StreamingStatusBatch
 * Body: { "emails": ["user1@example.com", "user2@example.com"] }
 * Response: { "statuses": [{ "email": "user1@example.com", "hasActiveSession": true, "lastSession": null }] }
 */
const batchHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.StreamingStatusRead)(ctx);
        serviceContainer.initialize();
        
        const applicationService = serviceContainer.resolve<StreamingStatusBatchApplicationService>('StreamingStatusBatchApplicationService');
        const callerId = ctx.bindings.callerId as string;
        
        const { emails } = req.body;
        
        const validation = validateEmailArray(emails);
        if (!validation.isValid) {
          return badRequest(ctx, validation.error!);
        }
        
        const response = await applicationService.getBatchStatus(emails, callerId);
        ok(ctx, response.toPayload());
      });
    });
  },
  { genericMessage: "Failed to fetch streaming status batch" }
);

export default batchHandler;
