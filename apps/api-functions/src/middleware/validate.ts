import { Context } from "@azure/functions";
import { ZodSchema, ZodError } from "zod";
import { badRequest } from "../utils/response";

/**
 * Creates Azure Functions middleware that validates the HTTP request body
 * against the provided Zod schema.
 *
 * @param {ZodSchema<any>} schema
 *   A Zod schema object defining the expected shape of `ctx.req.body`.
 * @returns {import("@azure/functions").Middleware}
 *   An async middleware function which:
 *     1. Ensures `ctx.req` exists (i.e. the function was HTTP-triggered).
 *     2. Checks that `ctx.req.body` is defined.
 *     3. Parses and validates the body against the schema.
 *     4. On success, attaches `validatedBody` to `ctx.bindings` and calls `next()`.
 *     5. On validation failure, returns 400 with a list of errors.
 *     6. On missing `ctx.req`, returns 500.
 *
 * @example
 * import { withBodyValidation } from "../middleware/withBodyValidation";
 * import { z } from "zod";
 *
 * const createUserSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * export default withBodyValidation(createUserSchema);
 */
export function withBodyValidation(schema: ZodSchema<any>) {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Ensure this function was invoked via HTTP trigger
    const req = ctx.req;
    if (!req) {
      ctx.res = {
        status: 500,
        body: "No HTTP request context",
      };
      return;
    }

    try {
      // Ensure the request body exists
      const body = req.body;
      if (body === undefined) {
        badRequest(ctx, "Request body is required");
        return;
      }

      // Validate and parse the body against the schema
      const validated = schema.parse(body);

      // Attach the validated result for downstream handlers
      (ctx as any).bindings = (ctx as any).bindings || {};
      (ctx as any).bindings.validatedBody = validated;

      // Proceed to the next middleware or handler
      await next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Transform Zod errors into a client-friendly format
        const validationErrors = err.errors.map(e => ({
          path: e.path,
          message: e.message,
        }));
        badRequest(ctx, { validationErrors });
      } else {
        // Rethrow unexpected errors
        throw err;
      }
    }
  };
}
