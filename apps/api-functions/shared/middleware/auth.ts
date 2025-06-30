// --- unchanged imports ---
import { Context, HttpRequest } from "@azure/functions";
import jwksClient from "jwks-rsa";
import jwt, { JwtHeader, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { config } from "../config";

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.azureTenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

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

export async function withAuth(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const req = ctx.req as HttpRequest;
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string|undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.log.warn("[withAuth] Missing or invalid Authorization header");
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing or invalid Authorization header" },
    };
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { azureTenantId, azureClientId } = config;
    if (!azureTenantId || !azureClientId) {
      ctx.log.error("[withAuth] Azure AD configuration missing");
      ctx.res = { status: 500, headers: { "Content-Type": "application/json" }, body: { error: "Server configuration error" } };
      return;
    }

    const validIssuers: [string,string] = [
      `https://login.microsoftonline.com/${azureTenantId}/v2.0`,
      `https://sts.windows.net/${azureTenantId}/`,
    ];
    const validAudience = azureClientId;

    const decoded = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        { issuer: validIssuers, audience: validAudience, algorithms: ["RS256"] },
        (err: VerifyErrors|null, payload?: JwtPayload|string) => {
          if (err) return reject(err);
          if (!payload || typeof payload === "string") return reject(new Error("Unexpected token payload"));
          resolve(payload);
        }
      );
    });

    // **Only** attach the decoded payload so downstream handlers
    // can pick off `decoded.oid` safely as a true GUID.
    (ctx as any).bindings = (ctx as any).bindings || {};
    (ctx as any).bindings.user = decoded;
    ctx.log.info("[withAuth] Authentication succeeded (oid)", { oid: decoded.oid });

    await next();
  } catch (err: any) {
    ctx.log.warn("[withAuth] Token verification failed", { error: err.message });
    ctx.res = {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Unauthorized" },
    };
  }
}
