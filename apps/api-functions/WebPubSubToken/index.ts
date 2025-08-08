import { AzureFunction, Context } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import { generateWebPubSubToken } from "../shared/services/webPubSubService";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../shared/config/index";

/**
 * HTTP-triggered function that issues a client access token for Azure Web PubSub.
 *
 * Based on the caller’s role, the token will allow them to join:
 * - **All roles**: the `"presence"` group (so everyone’s online/offline shows up)
 * - **Employees** additionally:
 *    - their personal group (`user.email`)
 *    - the `"cm-status-updates"` group (to receive Contact-Manager status broadcasts)
 *
 * @remarks
 * - Caller must be authenticated via `withAuth`.
 * - If the user record is missing or deleted, replies 401.
 * - Otherwise returns `{ token, endpoint, hubName }`.
 *
 * @param ctx - Azure Functions execution context,
 *              with `ctx.bindings.user` populated by `withAuth`.
 */
const issueWebPubSubToken: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      const claims = ctx.bindings.user as JwtPayload;
      const oid = (claims.oid ?? claims.sub) as string | undefined;
      if (!oid) {
        return unauthorized(ctx, "Cannot determine user identity");
      }

      const user = await prisma.user.findUnique({
        where: { azureAdObjectId: oid }
      });
      if (!user || user.deletedAt) {
        return unauthorized(ctx, "User not found or deleted");
      }

      const normalizedEmail = user.email.trim().toLowerCase();
      const role = user.role;

      // Always include the global presence channel
      const groups: string[] = ["presence"];

      if (role === "Employee") {
        // Employees also need:
        // 1) their personal group for commands
        // 2) the CM‐status‐updates channel
        groups.unshift(normalizedEmail);
        groups.push("cm-status-updates");
      }
      // Admins, Supervisors, ContactManagers remain on "presence"

      // Generate token scoped to the chosen groups
      const token = await generateWebPubSubToken({
        userId: normalizedEmail,
        groups,
      });

      return ok(ctx, {
        token,
        endpoint: config.webPubSubEndpoint,
        hubName:  config.webPubSubHubName,
      });
    });
  },
  {
    genericMessage: "Internal error issuing Web PubSub token",
    showStackInDev: true,
  }
);

export default issueWebPubSubToken;
