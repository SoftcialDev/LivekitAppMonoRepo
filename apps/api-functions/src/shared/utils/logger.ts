import { Context } from "@azure/functions";

/**
 * Log an informational message.
 * @param ctx - Azure Functions context
 * @param message - Message to log
 * @param props - Additional structured properties
 */
export function logInfo(ctx: Context, message: string, props?: Record<string, unknown>): void {
  // Azure Functions context.log.info admite optional properties
  if (props) {
    ctx.log.info(message, props);
  } else {
    ctx.log.info(message);
  }
}

/**
 * Log a warning message.
 * @param ctx - Azure Functions context
 * @param message - Warning message to log
 * @param props - Additional structured properties
 */
export function logWarn(ctx: Context, message: string, props?: Record<string, unknown>): void {
  if (props) {
    ctx.log.warn(message, props);
  } else {
    ctx.log.warn(message);
  }
}

/**
 * Log an error or exception.
 * If given an Error instance, includes its message and stack.
 * @param ctx - Azure Functions context
 * @param error - Error object or error message
 * @param props - Additional structured properties
 */
export function logError(ctx: Context, error: unknown, props?: Record<string, unknown>): void {
  if (error instanceof Error) {
    const errorProps = { message: error.message, stack: error.stack, ...props };
    ctx.log.error(error.message, errorProps);
  } else if (typeof error === "string") {
    ctx.log.error(error, props);
  } else {
    // para otros tipos, convierto a string
    const errStr = JSON.stringify(error);
    ctx.log.error(errStr, props);
  }
}

/**
 * Log a debug message.
 * @param ctx - Azure Functions context
 * @param message - Debug message to log
 * @param props - Additional structured properties
 */
export function logDebug(ctx: Context, message: string, props?: Record<string, unknown>): void {
  if (props) {
    ctx.log.verbose(message, props);
  } else {
    ctx.log.verbose(message);
  }
}
