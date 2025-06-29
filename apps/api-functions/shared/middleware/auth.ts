import { Context, HttpRequest } from "@azure/functions";
import jwksClient from "jwks-rsa";
import jwt, { JwtHeader, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { config } from "../config";

/**
 * JWKS client configured to fetch Azure AD signing keys.
 * Caches keys in memory and rate-limits requests.
 */
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.azureTenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

/**
 * Looks up the signing key based on the `kid` in JWT header.
 *
 * @param header - JWT header containing `kid`.
 * @param callback - Callback to return error or the PEM public key.
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
    const publicKey = key.getPublicKey();
    callback(null, publicKey);
  });
}

/**
 * Middleware to enforce JWT authentication with Azure AD.
 *
 * Steps:
 * 1. Read the Authorization header from ctx.req.
 * 2. Verify signature, issuer, and audience.
 * 3. If valid, attach decoded payload to ctx.bindings.user and proceed.
 * 4. If invalid, set ctx.res to 401 Unauthorized and stop execution.
 *
 * @param ctx - Azure Functions execution context (expects HTTP trigger).
 * @param next - Next function in the pipeline.
 */
export async function withAuth(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const req: HttpRequest = ctx.req!;
  const authHeader =
    (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;

  // 1. Check for Bearer token
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.log.warn("[withAuth] Missing or invalid Authorization header"); 
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing or invalid Authorization header" },
    };
    return;
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    const tenantId = config.azureTenantId;
    const clientId = config.azureClientId;
    if (!tenantId || !clientId) {
      ctx.log.error("[withAuth] Azure AD configuration missing (tenantId or clientId)");
      ctx.res = {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Server configuration error" },
      };
      return;
    }

    // Valid issuers: v2.0 endpoint and optionally v1.0 STS
    const validIssuers: [string, string] = [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ];

    // Audience: the Application (client) ID
    const validAudience: string = clientId;

    // 2. Verify JWT asynchronously using jwks-rsa getKey
    const decoded = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          issuer: validIssuers,
          audience: validAudience,
          algorithms: ["RS256"],
        },
        (err: VerifyErrors | null, payload?: JwtPayload | string) => {
          if (err) {
            return reject(err);
          }
          if (!payload || typeof payload === "string") {
            return reject(new Error("Unexpected token payload"));
          }
          resolve(payload);
        }
      );
    });

    // 3. Attach decoded claims for downstream handlers
    (ctx as any).bindings = (ctx as any).bindings || {};
    (ctx as any).bindings.user = decoded;
    ctx.log.info("[withAuth] Authentication succeeded", { oid: decoded.oid || decoded.sub });

    // 4. Proceed to next middleware/handler
    await next();
  } catch (err: any) {
    ctx.log.warn("[withAuth] Token verification failed or error occurred", { error: err.message });
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Unauthorized" },
    };
    return;
  }
}
