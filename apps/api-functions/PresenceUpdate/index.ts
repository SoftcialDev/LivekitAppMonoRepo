import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { PresenceUpdateRequest } from "../shared/domain/value-objects/PresenceUpdateRequest";
import { PresenceUpdateApplicationService } from "../shared/application/services/PresenceUpdateApplicationService";
import { presenceUpdateSchema } from "../shared/domain/schemas/PresenceUpdateSchema";

/**
 * PresenceUpdateFunction
 *
 * HTTP POST /api/PresenceUpdate,
 *
 * Authenticates via Azure AD JWT.
 * Body must include `{ status: "online" | "offline" }`.
 * Determines the user by Azure AD object ID from token,
 * then calls presenceService.setUserOnline or setUserOffline.
 *
 * @param ctx - Azure Functions execution context containing HTTP request.
 * @returns Promise<void> - 200 OK on success, or appropriate 4xx/5xx on error.
 */
const presenceUpdateHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(presenceUpdateSchema)(ctx, async () => {
          // Initialize service container
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          // Resolve application service
          const applicationService = serviceContainer.resolve<PresenceUpdateApplicationService>('PresenceUpdateApplicationService');
          const callerId = ctx.bindings.callerId as string;

          // Create request object
          const request = PresenceUpdateRequest.fromBody(callerId, ctx.bindings.validatedBody as any);

          // Execute presence update
          const response = await applicationService.updatePresence(callerId, request);

          // Return response
          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to update presence" }
);

export default presenceUpdateHandler;
