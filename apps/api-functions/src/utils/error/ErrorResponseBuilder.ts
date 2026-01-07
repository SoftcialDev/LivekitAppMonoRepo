/**
 * @fileoverview ErrorResponseBuilder - Builds HTTP error responses
 */

import { Context } from "@azure/functions";
import { ExpectedError, ErrorHandlerOptions } from '../../index';

export class ErrorResponseBuilder {
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

