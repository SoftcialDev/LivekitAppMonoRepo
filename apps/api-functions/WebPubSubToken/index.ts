import { Context, HttpRequest } from "@azure/functions";
import prisma from "../shared/services/prismaClienService";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import { generateWebPubSubToken } from "../shared/services/webPubSubService";
import { JwtPayload } from "jsonwebtoken";
import { config } from "../shared/config/index";

/**
 * WebPubSubToken Azure Function
 *
 * Issues an Azure Web PubSub client access token, scoped to the authenticated
 * employee’s group, allowing them to join and receive messages.
 *
 * @remarks
 * - **Endpoint**: GET /api/WebPubSubToken  
 * - **Auth**: Azure AD JWT in Authorization header  
 * - **Role**: only users with `Employee` role can access  
 * - **Email lookup**: email is read from the User record in the database,
 *   using the Azure AD object ID (`oid`/`sub`) from the token
 *
 * **Flow**:
 * 1. `withAuth` validates the JWT and populates `ctx.bindings.user` with claims.  
 * 2. Extract `oid` or `sub` from the claims and look up the User in the database.  
 * 3. Ensure the User exists, is not deleted, and has role `Employee`.  
 * 4. Read and normalize `user.email` from the database record.  
 * 5. Call `generateWebPubSubToken(email)` to get a scoped token.  
 * 6. Return `{ token, endpoint, hubName }` JSON.
 *
 * @param ctx - Azure Function execution context (bindings, logger, etc.)
 * @returns 200 OK with JSON `{ token: string; endpoint: string; hubName: string }`
 * @throws 401 Unauthorized if:
 *   - JWT is missing or invalid
 *   - User not found or deleted
 *   - User does not have Employee role
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    const claims = ctx.bindings.user as JwtPayload;
    const azureAdId = (claims.oid ?? claims.sub) as string | undefined;
    if (!azureAdId) {
      unauthorized(ctx, "Cannot determine user identity");
      return;
    }

    // Look up the user by Azure AD object ID
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId }
    });
    if (!user || user.deletedAt) {
      unauthorized(ctx, "User not found or deleted");
      return;
    }

    // Enforce Employee role
    if (user.role !== "Employee") {
      unauthorized(ctx, "Only employees may access this endpoint");
      return;
    }

    // Use the canonical email from the database
    const email = user.email.trim().toLowerCase();

    // Generate a Web PubSub token scoped to this user’s group
    const token = await generateWebPubSubToken(email);

    // Return token, endpoint, and hub name for client to connect
    ok(ctx, {
      token,
      endpoint: config.webPubSubEndpoint,
      hubName: config.webPubSubHubName
    });
  });
});
