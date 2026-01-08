/**
 * @fileoverview TalkSessionStart - Azure Function for starting talk sessions
 * @description Allows supervisors to start a talk session with a PSO
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withBodyValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { TalkSessionStartRequest } from '../../domain/value-objects/TalkSessionStartRequest';
import { TalkSessionApplicationService } from '../../application/services/TalkSessionApplicationService';
import { talkSessionStartSchema, TalkSessionStartParams } from '../../domain/schemas/TalkSessionStartSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

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
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as TalkSessionStartParams;
          const request = TalkSessionStartRequest.fromBody(callerId, validatedBody);

          const response = await applicationService.startTalkSession(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to start talk session" }
);

