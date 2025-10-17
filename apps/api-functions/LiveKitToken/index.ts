import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withQueryValidation } from "../shared/middleware/queryValidation";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { LiveKitTokenRequest } from "../shared/domain/value-objects/LiveKitTokenRequest";
import { LiveKitTokenApplicationService } from "../shared/application/services/LiveKitTokenApplicationService";
import { liveKitTokenSchema } from "../shared/domain/schemas/LiveKitTokenSchema";

/**
 * HTTP trigger for issuing LiveKit access tokens.
 *
 * Supports two modes:
 *  - **Employee**: returns a single `{ room, token }` for their personal room.
 *  - **Admin/Supervisor**: by default, returns one entry per other user's room.
 *
 * @remarks
 * - **Endpoint**: `GET /api/LiveKitToken[?userId=<roomId>]`
 * - **Auth**: Azure AD JWT in Authorization header
 *
 * @param ctx - Azure Functions context, includes:
 *   - `ctx.req.query.userId` (optional): database PK of the room to target
 *   - `ctx.bindings.user`: populated by `withAuth()`
 *
 * @returns 200 OK with JSON:
 * ```json
 * {
 *   "rooms": [ { "room": string, "token": string }, … ],
 *   "livekitUrl": string
 * }
 * ```
 * or 400/401 on error.
 */
const liveKitTokenHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withQueryValidation(ctx, liveKitTokenSchema, async (validatedQuery) => {
          // Initialize service container
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          // Resolve application service
          const applicationService = serviceContainer.resolve<LiveKitTokenApplicationService>('LiveKitTokenApplicationService');
          const callerId = ctx.bindings.callerId as string;

          // Create request object
          const request = LiveKitTokenRequest.fromParams(callerId, validatedQuery as any);

          // Execute token generation
          const response = await applicationService.generateToken(callerId, request);

          // Return response
          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to generate LiveKit token" }
);

export default liveKitTokenHandler;
