/**
 * @fileoverview TalkSessionStart - Azure Function for starting talk sessions
 * @description Allows supervisors to start a talk session with a PSO
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withBodyValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { TalkSessionStartRequest } from '../../index';
import { TalkSessionApplicationService } from '../../index';
import { talkSessionStartSchema } from '../../index';

/**
 * HTTP-triggered Azure Function that starts a talk session between supervisor and PSO.
 *
 * - **Endpoint:** POST `/api/TalkSessionStart`
 * - **Authentication:** Azure AD JWT
 * - **Request Body:** `{ psoEmail: string }`
 * - **Behavior:**
 *   1. Validates the JWT and parses the supervisor's Azure AD Object ID.
 *   2. Validates the request body against the schema.
 *   3. Creates a talk session record in the database.
 *   4. Broadcasts a WebSocket message to the PSO to notify them of the incoming talk.
 *   5. Returns a 200 OK response with the talk session ID.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @throws 401 Unauthorized if the supervisor's identity cannot be determined or the user record is missing/deleted.
 * @throws 400 Bad Request if the PSO is not found or the talk session creation fails.
 */
export default withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(talkSessionStartSchema)(ctx, async () => {
          await requirePermission(Permission.TalkSessionsStart)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<TalkSessionApplicationService>('TalkSessionApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = TalkSessionStartRequest.fromBody(callerId, validatedBody);

          const response = await applicationService.startTalkSession(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to start talk session" }
);

