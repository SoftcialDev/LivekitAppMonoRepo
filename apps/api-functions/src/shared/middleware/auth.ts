import { Context, HttpRequest } from "@azure/functions";
import jwksClient from "jwks-rsa";
import jwt, { JwtHeader, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { config } from "../config";

/**
 * JWKS client to fetch Azure AD signing keys.
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
 * 3. If valid, attach decoded payload to ctx.bindings.user.
 * 4. If invalid, return 401 Unauthorized.
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
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.res = {
      status: 401,
      body: "Missing or invalid Authorization header",
    };
    return;
  }

  const token = (authHeader as string).slice(7); // remove "Bearer "

  try {
    const tenantId = config.azureTenantId;
    const clientId = config.azureClientId;

    // Valid issuers: v2.0 and, if you need to accept older tokens, the v1 STS issuer.
    // Typed as a tuple [string, string] so it satisfies VerifyOptions issuer overload.
    const validIssuers: [string, string] = [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ];

    // Audience: use the Application (client) ID. If you need multiple accepted audiences,
    // you can supply a tuple like [clientId, otherValue].
    // Here, use a single string since only one is needed.
    const validAudience: string = clientId;

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
            reject(err);
            return;
          }
          if (!payload || typeof payload === "string") {
            reject(new Error("Unexpected token payload"));
            return;
          }
          resolve(payload);
        }
      );
    });

    // Attach decoded claims for downstream handlers
    (ctx as any).bindings = (ctx as any).bindings || {};
    (ctx as any).bindings.user = decoded;

    await next();
  } catch (err) {
    ctx.log.error("Authentication failed:", err);
    ctx.res = { status: 401, body: "Unauthorized" };
  }
}
