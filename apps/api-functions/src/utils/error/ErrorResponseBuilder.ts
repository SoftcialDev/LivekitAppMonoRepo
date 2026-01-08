/**
 * @fileoverview ErrorResponseBuilder - Builds HTTP error responses
 * @summary Utility class for constructing standardized HTTP error responses
 * @description Provides methods to build consistent error responses for ExpectedError (4xx)
 * and unexpected errors (5xx) in Azure Functions context
 */

import { Context } from "@azure/functions";
import { ExpectedError } from '../../middleware/errorHandler';
import { ErrorHandlerOptions } from '../../domain/types/ErrorHandlerTypes';

/**
 * Utility class for building HTTP error responses
 * @description Provides static methods to construct standardized error responses
 */
export class ErrorResponseBuilder {
  /**
   * Builds HTTP response for ExpectedError (4xx status codes)
   * @description Sets the Azure Functions context response with appropriate status code,
   * error message, and optional details. Skips if response is already populated.
   * @param error - ExpectedError instance to build response from
   * @param ctx - Azure Functions context
   * @example
   * const error = new ExpectedError('Invalid input', 400, { field: 'email' });
   * ErrorResponseBuilder.buildExpectedErrorResponse(error, ctx);
   */
  static buildExpectedErrorResponse(
    error: ExpectedError,
    ctx: Context
  ): void {
    if (!ctx.req) {
      return;
    }

    if (ctx.res?.status) {
      ctx.log.warn('Response already populated before ExpectedError; skipping override');
      return;
    }

    const body: Record<string, unknown> = { error: error.message };
    if (error.details !== undefined) {
      body.details = error.details;
    }

    ctx.res = {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body
    };
  }

  /**
   * Builds HTTP response for unexpected errors (500 status code)
   * @description Sets the Azure Functions context response with generic error message
   * and optionally includes stack trace in development mode. Skips if response is already populated.
   * @param error - Unknown error to build response from
   * @param ctx - Azure Functions context
   * @param options - Error handler options for customizing response behavior
   * @example
   * ErrorResponseBuilder.buildUnexpectedErrorResponse(
   *   error,
   *   ctx,
   *   { genericMessage: 'Internal error', showStackInDev: true, isProd: () => false }
   * );
   */
  static buildUnexpectedErrorResponse(
    error: unknown,
    ctx: Context,
    options: ErrorHandlerOptions
  ): void {
    if (!ctx.req) {
      return;
    }

    if (ctx.res?.status) {
      ctx.log.warn('Response already populated; skipping setting 500 response');
      return;
    }

    const body: Record<string, unknown> = {
      error: options.genericMessage || 'Internal Server Error'
    };

    if (options.showStackInDev && !options.isProd?.() && error instanceof Error) {
      body.stack = error.stack;
    }

    ctx.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body
    };
  }
}

