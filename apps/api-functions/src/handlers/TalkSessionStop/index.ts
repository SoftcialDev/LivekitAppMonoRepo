/**
 * @fileoverview TalkSessionStop - Azure Function for stopping talk sessions
 * @description Allows stopping an active talk session
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withBodyValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { TalkSessionStopRequest } from '../../index';
import { TalkSessionApplicationService } from '../../index';
import { talkSessionStopSchema } from '../../index';

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

        const validatedBody = (ctx as any).bindings.validatedBody;
        const request = TalkSessionStopRequest.fromBody(validatedBody);

        const response = await applicationService.stopTalkSession(request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  { genericMessage: "Failed to stop talk session" }
);

