import { Context, HttpRequest } from "@azure/functions";
import jwksClient from "jwks-rsa";
import jwt, { JwtHeader, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { config } from "../config";

/**
 * JWKS client configured to fetch public keys from Azure AD.
 * Caches keys in memory and rate-limits requests.
 */
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.azureTenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

/**
 * Retrieves the signing key corresponding to the JWT header’s `kid`.
 *
 * @param header   The parsed JWT header containing the `kid`.
 * @param callback Callback to receive either an Error or the public key (string or Buffer).
 */
function getKey(
  header: JwtHeader,
  callback: (err: Error | null, key?: string | Buffer) => void
): void {
  const kid = header.kid;
  if (!kid) {
    return callback(new Error("Missing `kid` in JWT header"));
  }

  client.getSigningKey(kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    // getPublicKey() returns the PEM-encoded public key
    const publicKey = key.getPublicKey();
    callback(null, publicKey);
  });
}

/**
 * Middleware that enforces JWT authentication against Azure AD.
 * 
 * 1. Extracts the `Authorization` header from `ctx.req`.
 * 2. Verifies the token’s signature, issuer, and audience.
 * 3. On success, stores the decoded payload in `ctx.bindings.user`.
 * 4. On failure, returns 401 Unauthorized.
 *
 * @param ctx   Azure Functions execution context, with `ctx.req` expected for HTTP triggers.
 * @param next  Function to invoke the next middleware or handler.
 * @returns     Resolves when request is authorized and downstream processing completes.
 */
export async function withAuth(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  // Ensure we have an HTTP request
  const req: HttpRequest = ctx.req!;
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.res = { status: 401, body: "Missing or invalid Authorization header" };
    return;
  }

  const token = (authHeader as string).slice(7); // remove "Bearer "

  try {
    const issuer = `https://login.microsoftonline.com/${config.azureTenantId}/v2.0`;
    const audience = config.azureClientId;

    // Verify JWT asynchronously using our getKey function
    const decoded = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          issuer,
          audience,
          algorithms: ["RS256"],
        },
        (err: VerifyErrors | null, payload?: JwtPayload | string) => {
          if (err) return reject(err);
          if (!payload || typeof payload === "string") {
            return reject(new Error("Invalid token payload"));
          }
          resolve(payload);
        }
      );
    });

    // Attach the decoded claims for downstream use
    (ctx as any).bindings = (ctx as any).bindings || {};
    (ctx as any).bindings.user = decoded;

    await next();
  } catch (err) {
    ctx.log.error("Authentication failure:", err);
    ctx.res = { status: 401, body: "Unauthorized" };
  }
}
