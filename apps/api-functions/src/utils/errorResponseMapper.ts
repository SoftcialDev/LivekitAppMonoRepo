/**
 * @fileoverview errorResponseMapper - Maps error messages to HTTP responses
 * @summary Helper for mapping error messages to appropriate HTTP response functions
 * @description Centralizes the logic for mapping error messages to HTTP response actions
 * (unauthorized, badRequest, etc.) to avoid duplication across middleware
 */

import { Context } from '@azure/functions';
import { unauthorized, badRequest } from './response';
import { extractErrorMessage } from './error';
import {
  CallerIdNotFoundError,
  InsufficientPrivilegesError,
  TargetNotPsoError
} from '../domain/errors/MiddlewareErrors';

/**
 * Maps middleware errors to appropriate HTTP responses
 * @description Handles common middleware error messages and throws the appropriate
 * HTTP response. If the error doesn't match any known pattern, returns false
 * to allow the caller to handle it themselves.
 * @param ctx - Azure Functions execution context
 * @param error - Unknown error to map to HTTP response
 * @returns True if error was handled (response was set), false otherwise
 * @example
 * if (!mapMiddlewareErrorToResponse(ctx, error)) {
 *   throw error; // Handle unknown errors
 * }
 */
export function mapMiddlewareErrorToResponse(ctx: Context, error: unknown): boolean {
  // Check if it's a known error instance first (more type-safe)
  if (error instanceof CallerIdNotFoundError || error instanceof InsufficientPrivilegesError) {
    unauthorized(ctx, error.message);
    return true;
  }

  if (error instanceof TargetNotPsoError) {
    badRequest(ctx, error.message);
    return true;
  }

  // Fallback to message matching for cases where error is just a message string
  const errorMessage = extractErrorMessage(error);
  
  if (errorMessage === 'Cannot determine caller identity') {
    unauthorized(ctx, errorMessage);
    return true;
  }

  if (errorMessage === 'Insufficient privileges') {
    unauthorized(ctx, errorMessage);
    return true;
  }

  if (errorMessage === 'Target user not found or not a PSO') {
    badRequest(ctx, errorMessage);
    return true;
  }

  return false;
}

