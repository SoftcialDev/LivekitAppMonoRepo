/**
 * @fileoverview errorHandler - Utility functions for error handling
 * @description Provides centralized error handling with HTTP status code mapping
 */

import { Context } from "@azure/functions";
import { badRequest, unauthorized } from "./response";
import { AuthError, ValidationError, MessagingError } from "../domain/errors/DomainError";

/**
 * Handles domain errors and returns appropriate HTTP responses
 * @param ctx - Azure Functions execution context
 * @param error - The domain error to handle
 * @param context - Additional context for logging
 * @returns HTTP response function call
 */
export function handleDomainError(
  ctx: Context, 
  error: AuthError | ValidationError | MessagingError,
  context?: Record<string, any>
): any {
  // Log the error with context
  const logContext = {
    statusCode: error.statusCode,
    message: error.message,
    ...context
  };

  if (error instanceof AuthError) {
    ctx.log.warn(`Authorization failed: ${error.message}`, logContext);
    return unauthorized(ctx, error.message);
  }

  if (error instanceof ValidationError) {
    ctx.log.warn(`Validation failed: ${error.message}`, logContext);
    return badRequest(ctx, error.message);
  }

  if (error instanceof MessagingError) {
    ctx.log.error(`Messaging failed: ${error.message}`, logContext);
    return badRequest(ctx, error.message);
  }

  // This should never happen due to the union type, but TypeScript needs it
  ctx.log.error(`Unknown domain error: ${(error as any).message}`, logContext);
  return badRequest(ctx, (error as any).message);
}

/**
 * Handles any error and returns appropriate HTTP response
 * @param ctx - Azure Functions execution context
 * @param error - The error to handle
 * @param context - Additional context for logging
 * @returns HTTP response function call
 */
export function handleAnyError(
  ctx: Context, 
  error: any,
  context?: Record<string, any>
): any {
  // Check if it's a known domain error
  if (error instanceof AuthError || error instanceof ValidationError || error instanceof MessagingError) {
    return handleDomainError(ctx, error, context);
  }

  // Handle unknown errors
  ctx.log.error("Unexpected error:", { error, ...context });
  return badRequest(ctx, "An unexpected error occurred");
}
