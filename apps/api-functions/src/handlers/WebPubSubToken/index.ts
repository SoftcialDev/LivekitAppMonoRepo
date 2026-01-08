/**
 * @fileoverview WebPubSubToken - Azure Function for generating WebPubSub tokens
 * @summary Issues client access tokens for Azure Web PubSub
 * @description HTTP-triggered function that generates WebPubSub tokens based on user roles
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth, withErrorHandler, withCallerId, requirePermission, Permission, ok, ServiceContainer, WebPubSubTokenRequest, WebPubSubTokenApplicationService, ExtendedContext, ensureBindings } from '../../index';

/**
 * HTTP-triggered function that issues a client access token for Azure Web PubSub.
 *
 * Based on the caller's role, the token will allow them to join:
 * - **All roles**: the `"presence"` group (so everyone's online/offline shows up)
 * - **PSOs** additionally:
 *    - their personal group (`user.email`)
 *    - the `"cm-status-updates"` group (to receive Contact-Manager status broadcasts)
 *
 * @remarks
 * - Caller must be authenticated via `withAuth`.
 * - If the user record is missing or deleted, replies 401.
 * - Otherwise returns `{ token, endpoint, hubName, groups }`.
 *
 * @param ctx - Azure Functions execution context
 * @param req - HTTP request object
 */
const webPubSubTokenHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.WebPubSubConnect)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const extendedCtx = ensureBindings(ctx);
        const applicationService = serviceContainer.resolve<WebPubSubTokenApplicationService>('WebPubSubTokenApplicationService');
        const callerId = extendedCtx.bindings.callerId as string;

        const request = new WebPubSubTokenRequest(callerId);
        const response = await applicationService.generateToken(callerId, request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal error issuing Web PubSub token",
    showStackInDev: true,
  }
);

export default webPubSubTokenHandler;
