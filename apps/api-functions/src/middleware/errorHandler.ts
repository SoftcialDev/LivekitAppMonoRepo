/**
 * @fileoverview Error Handler Middleware - Global error handling for Azure Functions
 * @summary Middleware for centralized error handling in Azure Functions
 * @description Provides error handler wrapper that catches, classifies, logs, and formats errors
 * into appropriate HTTP responses. Handles ExpectedError (4xx) and unexpected errors (5xx).
 */

import { Context } from "@azure/functions";
import { config } from "../config";
import { ServiceContainer } from "../infrastructure/container/ServiceContainer";
import { IErrorLogService } from "../domain/interfaces/IErrorLogService";
import { ErrorHandlerOptions } from "../domain/types/ErrorHandlerTypes";
import { ErrorType } from "../domain/enums/ErrorType";
import { DomainError } from "../domain/errors";
import { ErrorContextExtractor } from "../utils/error/ErrorContextExtractor";
import { ErrorTypeClassifier } from "../utils/error/ErrorTypeClassifier";
import { ErrorLogger } from "../utils/error/ErrorLogger";
import { ErrorResponseBuilder } from "../utils/error/ErrorResponseBuilder";

/**
 * Expected error for controlled 4xx responses
 * @description Represents errors that are expected and should result in client error responses (4xx)
 */
export class ExpectedError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  /**
   * Creates a new ExpectedError instance
   * @param message - Error message
   * @param statusCode - HTTP status code (defaults to 400)
   * @param details - Optional error details
   */
  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = "ExpectedError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Wraps handler to catch and format errors
 * @description Wraps an Azure Function handler with error handling that catches exceptions,
 * classifies them, logs them, and formats appropriate HTTP responses. ExpectedError instances
 * result in 4xx responses, while other errors result in 5xx responses.
 * @param fn - Handler function to wrap
 * @param options - Configuration options for error handling behavior
 * @returns Wrapped handler with error handling
 * @example
 * const handler = withErrorHandler(async (ctx) => {
 *   // handler logic
 * }, { genericMessage: 'An error occurred', showStackInDev: true });
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

      if (classification.type === ErrorType.Expected) {
        // Handle both ExpectedError and DomainError
        if (err instanceof DomainError) {
          ctx.log.warn(
            {
              event: "ExpectedError",
              message: err.message,
              statusCode: err.statusCode,
              errorType: err.constructor.name,
            },
            "Domain error thrown by handler"
          );
        } else {
          logExpectedError(ctx, err as ExpectedError);
        }
        ErrorResponseBuilder.buildExpectedErrorResponse(err as ExpectedError | DomainError, ctx);
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

/**
 * Creates an ErrorLogger instance using the service container
 * @description Initializes the service container if needed and resolves ErrorLogService
 * @returns ErrorLogger instance configured with ErrorLogService
 */
function createErrorLogger(): ErrorLogger {
  const serviceContainer = ServiceContainer.getInstance();
  if (!ServiceContainer.initialized) {
    serviceContainer.initialize();
  }
  const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
  return new ErrorLogger(errorLogService);
}

/**
 * Logs an expected error using Azure Functions context logger
 * @param ctx - Azure Functions context
 * @param error - ExpectedError instance to log
 */
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

/**
 * Logs an unexpected error using Azure Functions context logger
 * @description Handles both Error instances and unknown error types, logging appropriate details
 * @param ctx - Azure Functions context
 * @param error - Unknown error to log
 */
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
