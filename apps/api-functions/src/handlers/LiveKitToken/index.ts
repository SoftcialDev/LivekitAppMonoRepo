import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withQueryValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { LiveKitTokenRequest } from '../../index';
import { LiveKitTokenApplicationService } from '../../index';
import { liveKitTokenSchema } from '../../index';

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
        await withQueryValidation(liveKitTokenSchema)(ctx, async () => {
          await requirePermission(Permission.StreamingStatusRead)(ctx);
          // Initialize service container
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          // Resolve application service
          const applicationService = serviceContainer.resolve<LiveKitTokenApplicationService>('LiveKitTokenApplicationService');
          const callerId = ctx.bindings.callerId as string;

          // Create request object
          const validatedQuery = ctx.bindings.validatedQuery as any;
          const request = LiveKitTokenRequest.fromParams(callerId, validatedQuery);

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
