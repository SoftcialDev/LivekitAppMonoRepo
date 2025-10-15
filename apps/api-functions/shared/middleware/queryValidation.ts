/**
 * @fileoverview queryValidation - Middleware for query parameter validation
 * @summary Validates HTTP query parameters using Zod schemas
 * @description Provides middleware for validating and transforming query parameters
 */

import { Context } from "@azure/functions";
import { ZodSchema } from "zod";
import { badRequest } from "../utils/response";

/**
 * Middleware for validating query parameters using Zod schema
 * @param ctx - Azure Functions context
 * @param schema - Zod schema for query parameter validation
 * @param handler - Function to execute with validated query parameters
 * @returns Promise that resolves when validation and handler complete
 */
export async function withQueryValidation<T>(
  ctx: Context,
  schema: ZodSchema<T>,
  handler: (validatedQuery: T) => Promise<void>
): Promise<void> {
  const query = ctx.req?.query || {};
  
  const result = schema.safeParse(query);
  
  if (!result.success) {
    const issues = result.error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    );
    return badRequest(ctx, `Invalid query parameters: ${issues.join(', ')}`);
  }
  
  await handler(result.data);
}
