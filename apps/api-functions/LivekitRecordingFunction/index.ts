/**
 * @fileoverview LivekitRecordingFunction - Azure Function for LiveKit recording control
 * @summary Provides endpoint for controlling LiveKit recording sessions using DDD pattern
 * @description Handles authentication, authorization, and delegates to application service
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { LivekitRecordingApplicationService } from "../shared/application/services/LivekitRecordingApplicationService";
import { LivekitRecordingRequest } from "../shared/domain/value-objects/LivekitRecordingRequest";
import { livekitRecordingSchema } from "../shared/domain/schemas/LivekitRecordingSchema";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";

/**
 * Azure Function to control LiveKit recording sessions
 *
 * @remarks
 * - Authenticates the caller via `withAuth`
 * - Uses `withCallerId` middleware to extract caller ID
 * - Validates request body using `withBodyValidation`
 * - Only SuperAdmin role is authorized
 * - Supports START and STOP recording commands
 * - Resolves subject user from room name or falls back to caller
 *
 * @param ctx - Azure Functions context containing the HTTP request
 * @returns A 200 OK with JSON recording command result on success
 *          401 Unauthorized if no valid user identity
 *          403 Forbidden if insufficient permissions
 *          400 Bad Request on invalid request body
 */
const livekitRecordingHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(livekitRecordingSchema)(ctx, async () => {
          serviceContainer.initialize();
          
          const applicationService = serviceContainer.resolve<LivekitRecordingApplicationService>('LivekitRecordingApplicationService');
          const callerId = ctx.bindings.callerId as string;
          
          const request = LivekitRecordingRequest.fromBody((ctx as any).bindings.validatedBody);
          const response = await applicationService.processRecordingCommand(callerId, request);
          
          ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to process recording command" }
);

export default livekitRecordingHandler;