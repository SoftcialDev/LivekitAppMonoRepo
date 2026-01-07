/**
 * @fileoverview Error Handler Middleware - Global error handling for Azure Functions
 */

import { Context } from "@azure/functions";
import { config } from "../config";
import { ServiceContainer } from "../infrastructure/container/ServiceContainer";
import { IErrorLogService } from "../domain/interfaces/IErrorLogService";
import { ErrorHandlerOptions } from "../domain/types/ErrorHandlerTypes";
import { ErrorContextExtractor } from "../utils/error/ErrorContextExtractor";
import { ErrorTypeClassifier } from "../utils/error/ErrorTypeClassifier";
import { ErrorLogger } from "../utils/error/ErrorLogger";
import { ErrorResponseBuilder } from "../utils/error/ErrorResponseBuilder";

/**
 * Expected error for controlled 4xx responses.
 */
export class ExpectedError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = "ExpectedError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Wraps handler to catch and format errors.
 * ExpectedError → 4xx, other errors → 5xx.
 * @param fn - Handler function
 * @param options - Configuration options
 * @returns Wrapped handler with error handling
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
      await fn(ctx, ...args);
    } catch (err: unknown) {
      const classification = ErrorTypeClassifier.classify(err);
      const context = ErrorContextExtractor.extract(ctx);

      const errorLogger = createErrorLogger();
      await errorLogger.log(err, context, classification);

      if (classification.type === 'expected') {
        logExpectedError(ctx, err as ExpectedError);
        ErrorResponseBuilder.buildExpectedErrorResponse(err as ExpectedError, ctx);
        return;
      }

      logUnexpectedError(ctx, err);
      ErrorResponseBuilder.buildUnexpectedErrorResponse(
        err,
        ctx,
        { genericMessage, showStackInDev, isProd }
      );

      if (!ctx.req) {
        throw err;
      }
    }
  };
}

function createErrorLogger(): ErrorLogger {
  const serviceContainer = ServiceContainer.getInstance();
  if (!ServiceContainer.initialized) {
    serviceContainer.initialize();
  }
  const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
  return new ErrorLogger(errorLogService);
}

function logExpectedError(ctx: Context, error: ExpectedError): void {
  ctx.log.warn(
    {
      event: "ExpectedError",
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    },
    "Expected error thrown by handler"
  );
}

function logUnexpectedError(ctx: Context, error: unknown): void {
  if (error instanceof Error) {
    const errorDetails: Record<string, unknown> = {
      event: "UnhandledError",
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
    if ('cause' in error && error.cause !== undefined) {
      errorDetails.cause = error.cause;
    }
    
    ctx.log.error(
      errorDetails,
      `Unhandled exception in function: ${error.message}`
    );
  } else {
    ctx.log.error(
      {
        event: "UnhandledNonError",
        error: String(error),
        type: typeof error,
      },
      `Non-Error thrown in function: ${String(error)}`
    );
  }
}
