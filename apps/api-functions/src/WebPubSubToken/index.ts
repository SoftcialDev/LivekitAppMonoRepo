import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, unauthorized } from "../shared/utils/response";
import { generateWebPubSubToken } from "../shared/services/webPubSubService"
import { JwtPayload } from "jsonwebtoken";
import { config } from "../shared/config/index";

/**
 * WebPubSubToken Function
 *
 * HTTP GET /api/WebPubSubToken
 *
 * Issues an Azure Web PubSub access token to the authenticated employee.
 *
 * Authentication:
 * - Expects a valid Azure AD Bearer token in the Authorization header.
 * - The user’s email is extracted from the token claims.
 *
 * Success Response (200 OK):
 * {
 *   token: string,
 *   endpoint: string
 * }
 *
 * Error Responses:
 * 401 Unauthorized – missing/invalid token
 */
export default withErrorHandler(async (ctx: Context) => {
  const req: HttpRequest = ctx.req!;

  // 1) Authenticate via Azure AD; populates ctx.bindings.user
  await withAuth(ctx, async () => {
    const claims = (ctx as any).bindings.user as JwtPayload;
    // Extract email claim (could be 'upn' or 'email')
    const email = (claims.upn ?? claims.email) as string | undefined;

    if (!email) {
      // If no email claim present, reject
      unauthorized(ctx, "Email claim not found in token");
      return;
    }

    // 2) Generate Web PubSub token for this employee
    const token = generateWebPubSubToken(email);

    // 3) Return the token and endpoint for the client
    ok(ctx, {
      token,
      endpoint: config.webPubSubEndpoint
    });
  });
});
