/**
 * @fileoverview ErrorResponseBuilder - Builds HTTP error responses
 * @summary Utility for constructing HTTP error responses
 * @description Provides a single responsibility for building error responses
 */

import { Context } from "@azure/functions";
import { ExpectedError, ErrorHandlerOptions } from '../../index';

/**
 * Builds HTTP error responses
 * @description Encapsulates response building logic for different error types
 */
export class ErrorResponseBuilder {
  /**
   * Builds an HTTP response for expected errors (4xx)
   * @param error - Expected error instance
   * @param ctx - Azure Functions execution context
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
   * Builds an HTTP response for unexpected errors (5xx)
   * @param error - Unexpected error
   * @param ctx - Azure Functions execution context
   * @param options - Error handler options for customization
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

