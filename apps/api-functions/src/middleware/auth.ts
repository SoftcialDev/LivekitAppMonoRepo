/**
 * @fileoverview auth - JWT Bearer authentication middleware
 * @summary Middleware for enforcing JWT Bearer authentication in Azure Functions
 * @description Provides JWT authentication middleware that verifies tokens against Azure AD
 * and attaches decoded user information to the execution context
 */

import { Context, HttpRequest } from "@azure/functions";
import jwksClient from "jwks-rsa";
import jwt, {
  JwtHeader,
  JwtPayload,
  VerifyErrors,
  VerifyOptions,
  Algorithm,
} from "jsonwebtoken";
import { config } from "../config";
import { extractErrorMessage } from "../utils/error/ErrorHelpers";
import { ensureBindings } from "../domain/types/ContextBindings";

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.azureTenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

/**
 * Retrieves the public signing key corresponding to the JWT header's `kid`
 * @description Validates that the `kid` is present in the header and fetches
 * the matching JWK from Azure AD using the cached jwks client
 * @param header - The JWT header containing the Key ID (`kid`)
 * @param callback - Callback invoked with an error or the public key
 * @private
 */
function getKey(
  header: JwtHeader,
  callback: (err: Error | null, key?: string | Buffer) => void
): void {
  const kid = header.kid;
  if (!kid) {
    callback(new Error("JWT header is missing 'kid'"));
    return;
  }
  client.getSigningKey(kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, key.getPublicKey());
  });
}

/**
 * Azure Functions middleware to enforce JWT Bearer authentication
 * @description Enforces JWT Bearer authentication by verifying tokens against Azure AD.
 * Expects the Authorization header in the format `Bearer <token>`. Verifies issuer,
 * audience, and RS256 signature. On success, attaches decoded payload to `ctx.bindings.user`
 * and calls the next middleware. On failure, sets `ctx.res` to 401 and returns immediately.
 * Errors thrown by `next()` are not caught here, allowing global error handlers to process them.
 * @param ctx - Azure Functions execution context
 * @param next - Next middleware or handler function to invoke if authentication succeeds
 * @returns Promise that resolves once authentication is complete or `next()` completes
 * @example
 * const handler = withErrorHandler(async (ctx) => {
 *   await withAuth(ctx, async () => {
 *     // Handler logic - user is authenticated
 *   });
 * });
 */
export async function withAuth(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const req = ctx.req as HttpRequest;
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as
    | string
    | undefined;

  if (!authHeader?.startsWith("Bearer ")) {
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing or invalid Authorization header" },
    };
    return;
  }

  const token = authHeader.slice(7);

  let decoded: JwtPayload;
  try {
    const { azureTenantId, azureClientId } = config;
    if (!azureTenantId || !azureClientId) {
      ctx.res = {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Server configuration error" },
      };
      return;
    }

    const validIssuers = [
      `https://login.microsoftonline.com/${azureTenantId}/v2.0`,
      `https://sts.windows.net/${azureTenantId}/`,
    ] as [string, ...string[]];

    const opts: VerifyOptions = {
      issuer: validIssuers,
      audience: azureClientId,
      algorithms: ["RS256"] as [Algorithm, ...Algorithm[]],
    };

    decoded = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        opts,
        (err: VerifyErrors | null, payload?: JwtPayload | string) => {
          if (err) return reject(err);
          if (!payload || typeof payload === "string") {
            return reject(new Error("Unexpected token payload type"));
          }
          resolve(payload);
        }
      );
    });
  } catch (err: unknown) {
    const errorMessage = extractErrorMessage(err);
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: `Unauthorized: ${errorMessage}` },
    };
    return;
  }

  const extendedCtx = ensureBindings(ctx);
  extendedCtx.bindings.user = decoded;
  extendedCtx.bindings.accessToken = token;
  await next();
}
