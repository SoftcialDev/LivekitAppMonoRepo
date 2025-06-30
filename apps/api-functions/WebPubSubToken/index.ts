import { Context } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import { generateWebPubSubToken } from "../shared/services/webPubSubService";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../shared/config/index";

/**
 * Issues a Web PubSub client access token scoped to a group determined
 * by the authenticated user's role.
 *
 * @param ctx - Azure Functions execution context, containing bindings and logger.
 * @returns A HTTP 200 response with JSON `{ token, endpoint, hubName }`.
 * @throws 401 Unauthorized if authentication fails or the user's role is not permitted.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = ctx.bindings.user as JwtPayload;
    const azureAdId = (claims.oid ?? claims.sub) as string | undefined;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine user identity");
      return;
    }

    const user = await prisma.user.findUnique({ where: { azureAdObjectId: azureAdId } });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }

    const role = user.role;
    let groupName: string;

    if (role === "Employee") {
      groupName = user.email.trim().toLowerCase();
    } else if (role === "Admin" || role === "Supervisor") {
      groupName = "presence";
    } else {
      unauthorized(ctx, "Access denied: insufficient role");
      return;
    }

    const token = await generateWebPubSubToken(groupName);

    ok(ctx, {
      token,
      endpoint: config.webPubSubEndpoint,
      hubName:  config.webPubSubHubName,
    });
  });
});
