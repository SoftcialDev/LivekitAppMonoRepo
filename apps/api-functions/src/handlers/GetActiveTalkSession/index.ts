/**
 * @fileoverview GetActiveTalkSession - Azure Function for getting active talk session
 * @description Allows checking if a PSO has an active talk session
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok, badRequest } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetActiveTalkSessionRequest } from '../../domain/value-objects/GetActiveTalkSessionRequest';
import { GetActiveTalkSessionApplicationService } from '../../application/services/GetActiveTalkSessionApplicationService';
import { getActiveTalkSessionSchema } from '../../domain/schemas/GetActiveTalkSessionSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * HTTP-triggered Azure Function that checks if a PSO has an active talk session.
 *
 * - **Endpoint:** GET `/api/GetActiveTalkSession?psoEmail={email}`
 * - **Authentication:** Azure AD JWT
 * - **Query Parameters:** `psoEmail` (required)
 * - **Behavior:**
 *   1. Validates the JWT and parses the caller's Azure AD Object ID.
 *   2. Validates the query parameters against the schema.
 *   3. Checks if the PSO has an active talk session.
 *   4. Returns a 200 OK response with active session information.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @throws 401 Unauthorized if the caller's identity cannot be determined or the user record is missing/deleted.
 * @throws 400 Bad Request if the query parameters are invalid or the PSO is not found.
 */
export default withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.TalkSessionsCheckActive)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetActiveTalkSessionApplicationService>('GetActiveTalkSessionApplicationService');
        const extendedCtx = ensureBindings(ctx);
        const callerId = extendedCtx.bindings.callerId as string;

        const query = req.query || {};
        const validationResult = getActiveTalkSessionSchema.safeParse(query);

        if (!validationResult.success) {
          return badRequest(ctx, {
            message: 'Invalid query parameters',
            errors: validationResult.error.errors
          });
        }

        const request = GetActiveTalkSessionRequest.fromQuery(callerId, validationResult.data);
        const response = await applicationService.getActiveTalkSession(callerId, request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  { genericMessage: "Failed to get active talk session" }
);

