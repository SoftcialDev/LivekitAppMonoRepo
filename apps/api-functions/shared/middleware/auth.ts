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

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.azureTenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

/**
 * Retrieves the public signing key corresponding to the JWT header's `kid`.
 *
 * @param header - The JWT header containing the Key ID (`kid`).
 * @param callback - Callback invoked with an error or the public key.
 *
 * @remarks
 * - Validates that the `kid` is present in the header.
 * - Fetches and caches the matching JWK from Azure AD.
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
 * Azure Functions middleware to enforce JWT Bearer authentication.
 *
 * @param ctx - The Azure Functions execution context.
 * @param next - The next middleware or handler to invoke if authentication succeeds.
 * @returns A promise that resolves once authentication is done or `next()` completes.
 *
 * @remarks
 * - Expects the `Authorization` header in the format `Bearer <token>`.
 * - Verifies issuer, audience, and RS256 signature against Azure AD.
 * - On failure, sets `ctx.res = 401` and returns immediately.
 * - On success, attaches decoded payload to `ctx.bindings.user`, then calls `next()`.
 * - Errors thrown by `next()` are **not** caught here, so your global error handler sees them.
 */
export async function withAuth(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  ctx.log.verbose("[withAuth] Starting authentication check");

  const req = ctx.req as HttpRequest;
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as
    | string
    | undefined;

  if (!authHeader?.startsWith("Bearer ")) {
    ctx.log.warn("[withAuth] Missing or malformed Authorization header", { header: authHeader });
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing or invalid Authorization header" },
    };
    return;
  }

  const token = authHeader.slice(7);
  ctx.log.verbose("[withAuth] Token extracted (first 20 chars)", { snippet: token.slice(0, 20) });

  // === JWT verification block ===
  let decoded: JwtPayload;
  try {
    const { azureTenantId, azureClientId } = config;
    if (!azureTenantId || !azureClientId) {
      ctx.log.error("[withAuth] Azure AD configuration missing", { azureTenantId, azureClientId });
      ctx.res = {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Server configuration error" },
      };
      return;
    }

    // Non-empty tuple satisfies VerifyOptions.issuer
    const validIssuers = [
      `https://login.microsoftonline.com/${azureTenantId}/v2.0`,
      `https://sts.windows.net/${azureTenantId}/`,
    ] as [string, ...string[]];

    const opts: VerifyOptions = {
      issuer: validIssuers,
      audience: azureClientId,
      algorithms: ["RS256"] as [Algorithm, ...Algorithm[]],
    };

    ctx.log.verbose("[withAuth] Verifying JWT", { issuers: validIssuers, audience: azureClientId });

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

    ctx.log.info("[withAuth] JWT validated", {
      oid: decoded.oid,
      upn: decoded.upn,
      roles: decoded.roles,
    });
  } catch (err: any) {
    // Only JWT errors are caught here
    ctx.log.warn("[withAuth] Token verification failed", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: `Unauthorized: ${err.message}` },
    };
    return;
  }

  // === Auth succeeded: attach user and pass control ===
  (ctx as any).bindings.user = decoded;
  await next();
}
