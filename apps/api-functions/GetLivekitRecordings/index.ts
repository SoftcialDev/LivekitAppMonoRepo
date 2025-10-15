/**
 * @fileoverview GetLivekitRecordings - Azure Function for fetching LiveKit recordings
 * @summary Provides endpoint for retrieving recording sessions using DDD pattern
 * @description Handles authentication, authorization, and delegates to application service
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withQueryValidation } from "../shared/middleware/queryValidation";
import { ok } from "../shared/utils/response";
import { GetLivekitRecordingsApplicationService } from "../shared/application/services/GetLivekitRecordingsApplicationService";
import { GetLivekitRecordingsRequest } from "../shared/domain/value-objects/GetLivekitRecordingsRequest";
import { getLivekitRecordingsSchema } from "../shared/domain/schemas/GetLivekitRecordingsSchema";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";

/**
 * Azure Function to fetch LiveKit recording sessions
 *
 * @remarks
 * - Authenticates the caller via `withAuth`
 * - Uses `withCallerId` middleware to extract caller ID
 * - Validates query parameters using `withQueryValidation`
 * - Only Admin and SuperAdmin roles are authorized
 * - Returns recording sessions with UI-ready data including user resolution and SAS URLs
 *
 * @param ctx - Azure Functions context containing the HTTP request
 * @returns A 200 OK with JSON `{ items: RecordingListItem[], count: number }` on success
 *          401 Unauthorized if no valid user identity
 *          403 Forbidden if insufficient permissions
 *          400 Bad Request on invalid query parameters
 */
const getLivekitRecordingsHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withQueryValidation(ctx, getLivekitRecordingsSchema, async (validatedQuery: any) => {
          serviceContainer.initialize();
          
          const applicationService = serviceContainer.resolve<GetLivekitRecordingsApplicationService>('GetLivekitRecordingsApplicationService');
          const callerId = ctx.bindings.callerId as string;
          
          const request = GetLivekitRecordingsRequest.fromQuery(validatedQuery);
          const response = await applicationService.getLivekitRecordings(callerId, request);
          
          ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to fetch recordings" }
);

export default getLivekitRecordingsHandler;
