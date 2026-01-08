/**
 * @fileoverview TalkSessionStop - Azure Function for stopping talk sessions
 * @description Allows stopping an active talk session
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { TalkSessionStopRequest } from '../../domain/value-objects/TalkSessionStopRequest';
import { TalkSessionApplicationService } from '../../application/services/TalkSessionApplicationService';
import { talkSessionStopSchema, TalkSessionStopParams } from '../../domain/schemas/TalkSessionStopSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * HTTP-triggered Azure Function that stops an active talk session.
 *
 * - **Endpoint:** POST `/api/TalkSessionStop`
 * - **Authentication:** Azure AD JWT
 * - **Request Body:** `{ talkSessionId: string, stopReason: TalkStopReason }`
 * - **Behavior:**
 *   1. Validates the JWT.
 *   2. Validates the request body against the schema.
 *   3. Updates the talk session record in the database with stop time and reason.
 *   4. Returns a 200 OK response with a confirmation message.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @throws 401 Unauthorized if the user's identity cannot be determined.
 * @throws 400 Bad Request if the talk session is not found or the stop operation fails.
 */
export default withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withBodyValidation(talkSessionStopSchema)(ctx, async () => {
        await requirePermission(Permission.TalkSessionsStop)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<TalkSessionApplicationService>('TalkSessionApplicationService');
        const extendedCtx = ensureBindings(ctx);

        const validatedBody = extendedCtx.bindings.validatedBody as TalkSessionStopParams;
        const request = TalkSessionStopRequest.fromBody(validatedBody);

        const response = await applicationService.stopTalkSession(request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  { genericMessage: "Failed to stop talk session" }
);

