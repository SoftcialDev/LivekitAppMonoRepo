import { Context } from "@azure/functions";

/**
 * Send 200 OK with JSON body.
 * @param ctx Azure Functions context
 * @param data Payload to return
 */
export function ok(ctx: Context, data: any) {
  ctx.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: data,
  };
}

/**
 * Send 400 Bad Request with error message or object.
 * @param ctx Azure Functions context
 * @param error String or object describing the error
 */
export function badRequest(ctx: Context, error: string | object) {
  ctx.res = {
    status: 400,
    headers: { "Content-Type": "application/json" },
    body: typeof error === "string" ? { error } : error,
  };
}

/**
 * Send 401 Unauthorized.
 * @param ctx Azure Functions context
 * @param message Optional error message
 */
export function unauthorized(ctx: Context, message = "Unauthorized") {
  ctx.res = {
    status: 401,
    headers: { "Content-Type": "application/json" },
    body: { error: message },
  };
}

/**
 * Send 403 Forbidden.
 * @param ctx Azure Functions context
 * @param message Optional error message
 */
export function forbidden(ctx: Context, message = "Forbidden") {
  ctx.res = {
    status: 403,
    headers: { "Content-Type": "application/json" },
    body: { error: message },
  };
}

/**
 * Send 404 Not Found.
 * @param ctx Azure Functions context
 * @param message Optional error message
 */
export function notFound(ctx: Context, message = "Not Found") {
  ctx.res = {
    status: 404,
    headers: { "Content-Type": "application/json" },
    body: { error: message },
  };
}
