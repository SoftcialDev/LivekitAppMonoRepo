/**
 * @fileoverview WebPubSubToken - Azure Function for generating WebPubSub tokens
 * @summary Issues client access tokens for Azure Web PubSub
 * @description HTTP-triggered function that generates WebPubSub tokens based on user roles
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { WebPubSubTokenRequest } from "../shared/domain/value-objects/WebPubSubTokenRequest";
import { WebPubSubTokenApplicationService } from "../shared/application/services/WebPubSubTokenApplicationService";

/**
 * HTTP-triggered function that issues a client access token for Azure Web PubSub.
 *
 * Based on the caller's role, the token will allow them to join:
 * - **All roles**: the `"presence"` group (so everyone's online/offline shows up)
 * - **Employees** additionally:
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
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<WebPubSubTokenApplicationService>('WebPubSubTokenApplicationService');
        const callerId = ctx.bindings.callerId as string;

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
