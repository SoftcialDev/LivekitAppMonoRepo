import { Context, HttpRequest } from "@azure/functions";
import { config } from "../config";

/**
 * Configuration options for the error handler middleware.
 */
export interface ErrorHandlerOptions {
  /**
   * Message to return in the response body for unexpected (500) errors.
   * @default "Internal Server Error"
   */
  genericMessage?: string;

  /**
   * Include the error stack trace in the JSON response when running
   * outside of production.
   * @default false
   */
  showStackInDev?: boolean;

  /**
   * Function to determine if the current environment is production.
   * By default, checks `config.node_env === "production"`.
   */
  isProd?: () => boolean;
}

/**
 * Represents a controlled, expected error that maps to a 4xx response.
 * Throw this from your handlers to return a customization of status code and details.
 */
export class ExpectedError extends Error {
  /** The HTTP status code to use (4xx). */
  public readonly statusCode: number;
  /** Optional additional details to include in the response. */
  public readonly details?: unknown;

  /**
   * @param message - Human‐readable error message to return in the response.
   * @param statusCode - HTTP 4xx status code (e.g. 400 for bad request).
   * @param details - Optional extra details (e.g. validation error object).
   */
  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = "ExpectedError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Wraps an Azure Function handler to catch and format both expected (4xx)
 * and unexpected (5xx) errors, without leaking stack traces in production.
 *
 * @typeParam Args - Additional argument tuple types after `Context`.
 *
 * @param fn - The original handler function. It must return a Promise.
 *             Throw `ExpectedError` for controlled 4xx errors;
 *             throw other `Error` types for 5xx.
 * @param options - Optional customization:
 *   - `genericMessage`: message for 500 responses.
 *   - `showStackInDev`: include stack in non‐production.
 *   - `isProd`: override to detect production environment.
 *
 * @returns A new async function with identical signature that:
 *   1. Invokes `fn(ctx, ...args)`.
 *   2. If `ExpectedError` is thrown:
 *      - Logs a warning with its message, status code, and details.
 *      - For HTTP triggers (`ctx.req` present), sets `ctx.res` to the specified 4xx.
 *      - Returns without rethrowing.
 *   3. If other error is thrown:
 *      - Logs as an error (including stack).
 *      - For HTTP triggers, sets `ctx.res` to 500 (unless already set),
 *        including stack if `showStackInDev && !isProd()`.
 *      - For non‐HTTP triggers, rethrows to let Azure mark function as failed.
 *
 * @example
 * ```ts
 * import { AzureFunction, Context } from "@azure/functions";
 * import {
 *   withErrorHandler,
 *   ExpectedError,
 * } from "../middleware/withErrorHandler";
 *
 * const hello: AzureFunction = async (ctx: Context) => {
 *   const req = ctx.req as HttpRequest;
 *   const name = req.query.name;
 *   if (!name) {
 *     throw new ExpectedError("Name is required", 400);
 *   }
 *   ctx.res = {
 *     status: 200,
 *     body: { message: `Hello, ${name}` },
 *   };
 * };
 *
 * export default withErrorHandler(hello, {
 *   genericMessage: "Something went wrong",
 *   showStackInDev: true,
 * });
 * ```
 */
export function withErrorHandler<Args extends any[]>(
  fn: (ctx: Context, ...args: Args) => Promise<void>,
  options: ErrorHandlerOptions = {}
): (ctx: Context, ...args: Args) => Promise<void> {
  const {
    genericMessage = "Internal Server Error",
    showStackInDev = false,
    isProd = () => config.node_env === "production",
  } = options;

  return async function (ctx: Context, ...args: Args): Promise<void> {
    try {
      await fn(ctx, ...args);
    } catch (err: unknown) {
      // Handle expected (4xx) errors
      if (err instanceof ExpectedError) {
        ctx.log.warn(
          {
            event: "ExpectedError",
            message: err.message,
            statusCode: err.statusCode,
            details: err.details,
          },
          "Expected error thrown by handler"
        );

        if (ctx.req) {
          if (!ctx.res?.status) {
            const body: Record<string, unknown> = { error: err.message };
            if (err.details !== undefined) {
              body.details = err.details;
            }
            ctx.res = {
              status: err.statusCode,
              headers: { "Content-Type": "application/json" },
              body,
            };
          } else {
            ctx.log.warn(
              "Response already populated before ExpectedError; skipping override"
            );
          }
        }
        return;
      }

      // Handle unexpected (5xx) errors
      if (err instanceof Error) {
        ctx.log.error(
          {
            event: "UnhandledError",
            message: err.message,
            stack: err.stack,
          },
          "Unhandled exception in function"
        );
      } else {
        ctx.log.error(
          {
            event: "UnhandledNonError",
            error: String(err),
          },
          "Non-Error thrown in function"
        );
      }

      if (ctx.req) {
        if (!ctx.res?.status) {
          const body: Record<string, unknown> = { error: genericMessage };
          if (showStackInDev && !isProd() && err instanceof Error) {
            body.stack = err.stack;
          }
          ctx.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body,
          };
        } else {
          ctx.log.warn(
            "Response already populated; skipping setting 500 response"
          );
        }
        return;
      }

      // For non-HTTP triggers, rethrow so Azure marks function as failed
      throw err;
    }
  };
}
