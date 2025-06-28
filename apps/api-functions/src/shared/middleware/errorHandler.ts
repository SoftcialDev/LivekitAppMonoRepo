import { Context, HttpRequest } from "@azure/functions";
import { config } from "../config";

/**
 * Options to customize the behavior of the error handler middleware.
 */
export interface ErrorHandlerOptions {
  /**
   * Generic message to return in the response body when an unexpected error occurs.
   * Defaults to "Internal Server Error".
   */
  genericMessage?: string;
  /**
   * Whether to include the error stack in the response when not in production.
   * Defaults to false.
   */
  showStackInDev?: boolean;
  /**
   * Function to determine if the current environment is production.
   * Defaults to checking process.env.NODE_ENV === "production".
   */
  isProd?: () => boolean;
}

/**
 * A custom error type for expected/domain errors (e.g., validation failures).
 * Handlers can throw instances of this to return a controlled 4xx response.
 */
export class ExpectedError extends Error {
  /**
   * HTTP status code to use for this expected error (e.g., 400 for validation).
   */
  public readonly statusCode: number;
  /**
   * Any additional details to include in the response body.
   */
  public readonly details?: unknown;

  /**
   * @param message - Error message to return.
   * @param statusCode - HTTP status code (4xx) to use.
   * @param details - Optional extra details (e.g., validation errors).
   */
  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = "ExpectedError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Wraps an Azure Function handler to catch and handle unexpected errors.
 *
 * @typeParam Args - Additional argument tuple types after Context.
 * @param fn - The original handler function. Receives Context and optionally other arguments
 *             (e.g., HttpRequest if you extract from context, or custom args).
 *             Should throw ExpectedError for controlled 4xx errors, or other errors for 5xx.
 * @param options - Optional settings:
 *   - genericMessage: message to return on 500 responses.
 *   - showStackInDev: whether to include stack in non-production.
 *   - isProd: override to detect production environment.
 * @returns A new async function that:
 *   1. Invokes the original handler (`fn(ctx, ...args)`).
 *   2. If an ExpectedError is thrown, logs at warning level and returns that status/message.
 *   3. If an unexpected error is thrown:
 *      - Logs at error level.
 *      - For HTTP triggers (detected via `ctx.req`), sets a 500 response (unless already set).
 *      - For non-HTTP triggers, rethrows to let Azure runtime mark failure.
 *
 * @example
 * ```ts
 * // handlers/myFunction.ts
 * import { AzureFunction, Context, HttpRequest } from "@azure/functions";
 * import { withErrorHandler, ExpectedError } from "../middleware/withErrorHandler";
 *
 * const myFunction: AzureFunction = async function (context: Context): Promise<void> {
 *   const req = context.req as HttpRequest;
 *   const name = req.query.name;
 *   if (!name) {
 *     // Throwing ExpectedError leads to 400 response with message and optional details.
 *     throw new ExpectedError("Query parameter 'name' is required", 400);
 *   }
 *   context.res = {
 *     status: 200,
 *     body: { greeting: `Hello, ${name}!` },
 *   };
 * };
 *
 * export default withErrorHandler(myFunction, {
 *   genericMessage: "Something went wrong on the server",
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
      return await fn(ctx, ...args);
    } catch (err: unknown) {
      // Determine if this is an ExpectedError (controlled 4xx)
      if (err instanceof ExpectedError) {
        // Log a warning for expected/domain errors
        ctx.log.warn(
          {
            message: "Expected error in function",
            error: err.message,
            statusCode: err.statusCode,
            details: err.details,
          }
        );
        // If HTTP trigger, set response accordingly
        if (ctx.req) {
          // Avoid overwriting if already set to a response with a status
          if (!ctx.res || typeof ctx.res.status === "undefined") {
            const body: any = { error: err.message };
            if (err.details !== undefined) {
              body.details = err.details;
            }
            ctx.res = {
              status: err.statusCode,
              headers: { "Content-Type": "application/json" },
              body,
            };
          } else {
            ctx.log.warn("Response was already set before ExpectedError; skipping setting response.");
          }
        }
        // For non-HTTP triggers, swallow or rethrow? Here, we consider it handled.
        return;
      }

      // Unexpected error: log at error level with structure
      if (err instanceof Error) {
        ctx.log.error({
          message: "Unhandled error in function",
          error: err.message,
          stack: err.stack,
        });
      } else {
        ctx.log.error({
          message: "Unhandled non-Error exception in function",
          error: String(err),
        });
      }

      // If HTTP trigger (ctx.req exists), return 500 response if not already set
      if (ctx.req) {
        // Prepare response body
        const body: any = { error: genericMessage };
        if (!isProd() && showStackInDev && err instanceof Error) {
          body.stack = err.stack;
        }
        if (!ctx.res || typeof ctx.res.status === "undefined") {
          ctx.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body,
          };
        } else {
          ctx.log.warn("Error occurred after response was already set; skipping setting 500 response.");
        }
        // Do not rethrow, as response is set
        return;
      }

      // Non-HTTP trigger: rethrow so runtime can mark failure
      throw err;
    }
  };
}
