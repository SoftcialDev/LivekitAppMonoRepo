/**
 * @fileoverview TalkSessionStop - Azure Function for stopping talk sessions
 * @description Allows stopping an active talk session
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { requirePermission } from "../shared/middleware/permissions";
import { Permission } from "../shared/domain/enums/Permission";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { TalkSessionStopRequest } from "../shared/domain/value-objects/TalkSessionStopRequest";
import { TalkSessionApplicationService } from "../shared/application/services/TalkSessionApplicationService";
import { talkSessionStopSchema } from "../shared/domain/schemas/TalkSessionStopSchema";

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

