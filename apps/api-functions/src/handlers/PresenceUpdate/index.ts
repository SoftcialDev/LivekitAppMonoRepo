import { Context, HttpRequest } from "@azure/functions";
import { withAuth, withErrorHandler, withCallerId, withBodyValidation, ok, ServiceContainer, PresenceUpdateRequest, PresenceUpdateApplicationService, presenceUpdateSchema, ensureBindings, PresenceUpdateParams } from '../../index';

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
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          // Create request object
          const validatedBody = extendedCtx.bindings.validatedBody as PresenceUpdateParams;
          const request = PresenceUpdateRequest.fromBody(callerId, validatedBody);

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
