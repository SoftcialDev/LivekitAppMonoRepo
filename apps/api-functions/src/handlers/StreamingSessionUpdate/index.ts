import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withBodyValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { StreamingSessionUpdateRequest } from '../../domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingSessionUpdateApplicationService } from '../../application/services/StreamingSessionUpdateApplicationService';
import { streamingSessionUpdateSchema, StreamingSessionUpdateParams } from '../../domain/schemas/StreamingSessionUpdateSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * HTTP-triggered Azure Function that updates the streaming session for the authenticated user.
 *
 * - **Endpoint:** POST `/api/StreamingSessionUpdate`
 * - **Authentication:** Azure AD JWT
 * - **Request Body:** `{ status: "started" | "stopped", isCommand?: boolean }`
 * - **Behavior:**
 *   1. Validates the JWT and parses the user's Azure AD Object ID.
 *   2. Validates the request body against the schema.
 *   3. Looks up the user in the database by Azure AD Object ID.
 *   4. Calls start or stop streaming session based on status.
 *   5. Returns a 200 OK response with a confirmation message.
 *
 * @param ctx - The Azure Functions execution context.
 * @param ctx.req - The incoming HTTP request.
 * @throws 401 Unauthorized if the user's identity cannot be determined or the user record is missing/deleted.
 * @throws 400 Bad Request if the streaming service call fails.
 */
export default withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(streamingSessionUpdateSchema)(ctx, async () => {
          await requirePermission(Permission.StreamingStatusRead)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<StreamingSessionUpdateApplicationService>('StreamingSessionUpdateApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as StreamingSessionUpdateParams;
          const request = StreamingSessionUpdateRequest.fromBody(callerId, validatedBody);

          const response = await applicationService.updateStreamingSession(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to update streaming session" }
);
