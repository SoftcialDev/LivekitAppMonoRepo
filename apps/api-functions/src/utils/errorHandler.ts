/**
 * @fileoverview errorHandler - Utility functions for error handling
 * @description Provides centralized error handling with HTTP status code mapping
 */

import { Context } from "@azure/functions";
import { badRequest, unauthorized } from "./response";
import { AuthError, ValidationError, MessagingError } from "../domain/errors/DomainError";
import { logWarn, logError } from "./logger";

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
  context?: Record<string, unknown>
): void {
  // Log the error with context
  const logContext = {
    statusCode: error.statusCode,
    message: error.message,
    ...context
  };

  if (error instanceof AuthError) {
    logWarn(ctx, `Authorization failed: ${error.message}`, logContext);
    unauthorized(ctx, error.message);
    return;
  }

  if (error instanceof ValidationError) {
    logWarn(ctx, `Validation failed: ${error.message}`, logContext);
    badRequest(ctx, error.message);
    return;
  }

  if (error instanceof MessagingError) {
    logError(ctx, error, logContext);
    badRequest(ctx, error.message);
    return;
  }

  // This should never happen due to the union type, but TypeScript needs it
  // Handle any remaining error types
  const errorMessage = String(error);
  logError(ctx, error, logContext);
  badRequest(ctx, errorMessage);
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
  error: unknown,
  context?: Record<string, unknown>
): void {
  // Check if it's a known domain error
  if (error instanceof AuthError || error instanceof ValidationError || error instanceof MessagingError) {
    handleDomainError(ctx, error, context);
    return;
  }

  // Handle unknown errors
  logError(ctx, error, context);
  badRequest(ctx, "An unexpected error occurred");
}
