/**
 * @fileoverview PathValidation - Middleware for validating path parameters
 * @summary Validates path parameters using Zod schemas
 * @description Middleware for validating and extracting path parameters from Azure Functions context
 */

import { Context } from "@azure/functions";
import { ZodSchema } from "zod";
import { badRequest } from "../utils/response";

/**
 * Middleware factory for validating path parameters
 * @param ctx - Azure Functions context
 * @param schema - Zod schema for validating path parameters
 * @param handler - Function to execute after validation
 * @returns Promise that resolves when validation and handler complete
 */
export function withPathValidation<T>(
  ctx: Context,
  schema: ZodSchema<T>,
  handler: (ctx: Context, validatedParams: T) => Promise<void>
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Extract path parameters from context
      let params = (ctx as any).bindings?.params || {};
      
      // If no params, try to extract from req.params
      if (!params || Object.keys(params).length === 0) {
        const req = (ctx as any).req;
        if (req && req.params) {
          params = req.params;
        }
      }
      
      // Validate path parameters
      const validatedParams: T = schema.parse(params);
      
      // Execute handler with validated parameters
      await handler(ctx, validatedParams);
      resolve();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        return badRequest(ctx, `Invalid path parameters: ${errorMessages.join(', ')}`);
      }
      
      reject(error);
    }
  });
}
