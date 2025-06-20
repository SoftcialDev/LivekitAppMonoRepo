import { Context } from "@azure/functions";

/**
 * Log an informational message.
 * @param ctx  Azure Functions context
 * @param message  Message to log
 * @param props  Additional structured properties
 */
export function logInfo(ctx: Context, message: string, props?: Record<string, any>) {
  ctx.log.info(message, props);
}

/**
 * Log an error.
 * @param ctx  Azure Functions context
 * @param error  Error object or message
 * @param props  Additional structured properties
 */
export function logError(ctx: Context, error: any, props?: Record<string, any>) {
  ctx.log.error(error, props);
}
