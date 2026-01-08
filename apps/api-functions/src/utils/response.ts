import { Context } from "@azure/functions";

/**
 * Send 200 OK with JSON body.
 * @param ctx - Azure Functions context
 * @param data - Payload to return
 */
export function ok(ctx: Context, data: unknown): void {
  ctx.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: data,
  };
}

/**
 * Send 400 Bad Request with error message or object.
 * @param ctx - Azure Functions context
 * @param error - String or object describing the error
 */
export function badRequest(ctx: Context, error: string | object): void {
  ctx.res = {
    status: 400,
    headers: { "Content-Type": "application/json" },
    body: typeof error === "string" ? { error } : error,
  };
}

/**
 * Send 204 No Content.
 * @param ctx - Azure Functions context
 */
export function noContent(ctx: Context): void {
  ctx.res = {
    status: 204,
    body: null,
  };
}

/**
 * Send 401 Unauthorized.
 * @param ctx - Azure Functions context
 * @param message - Optional error message
 */
export function unauthorized(ctx: Context, message = "Unauthorized"): void {
  ctx.res = {
    status: 401,
    headers: { "Content-Type": "application/json" },
    body: { error: message },
  };
}

/**
 * Send 403 Forbidden.
 * @param ctx - Azure Functions context
 * @param message - Optional error message
 */
export function forbidden(ctx: Context, message = "Forbidden"): void {
  ctx.res = {
    status: 403,
    headers: { "Content-Type": "application/json" },
    body: { error: message },
  };
}

/**
 * Send 404 Not Found.
 * @param ctx - Azure Functions context
 * @param message - Optional error message
 */
export function notFound(ctx: Context, message = "Not Found"): void {
  ctx.res = {
    status: 404,
    headers: { "Content-Type": "application/json" },
    body: { error: message },
  };
}
