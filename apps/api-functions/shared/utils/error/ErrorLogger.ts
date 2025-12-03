/**
 * @fileoverview ErrorLogger - Handles error logging to database
 * @summary Service for logging errors to database with context
 * @description Provides a single responsibility for error logging operations
 */

import { IErrorLogService } from "../../domain/interfaces/IErrorLogService";
import { ErrorSource } from "../../domain/enums/ErrorSource";
import { ErrorContext } from "./ErrorContextExtractor";
import { ErrorClassification } from "./ErrorTypeClassifier";

/**
 * Handles error logging to database
 * @description Encapsulates error logging logic with proper error handling
 */
export class ErrorLogger {
  /**
   * Creates a new ErrorLogger instance
   * @param errorLogService - Service for logging errors to database
   */
  constructor(
    private readonly errorLogService: IErrorLogService
  ) {}

  /**
   * Logs an error to the database with full context
   * @param error - Error to log
   * @param context - Error context extracted from Azure Functions context
   * @param classification - Error classification with type and severity
   * @returns Promise that resolves when logging is complete (or fails silently)
   */
  async log(
    error: unknown,
    context: ErrorContext,
    classification: ErrorClassification
  ): Promise<void> {
    if (!classification.shouldLog) {
      return;
    }

    try {
      await this.errorLogService.logError({
        source: this.determineErrorSource(classification.type),
        endpoint: context.endpoint,
        functionName: context.functionName,
        error: this.normalizeError(error),
        userId: context.userId,
        httpStatusCode: classification.statusCode,
        severity: classification.severity,
        context: {
          method: context.method,
          url: context.url,
          invocationId: context.invocationId
        }
      });
    } catch (logError) {
      console.warn('[ErrorLogger] Failed to log error to database', {
        originalError: error instanceof Error ? error.message : String(error),
        logError: logError instanceof Error ? logError.message : String(logError)
      });
    }
  }

  /**
   * Determines error source based on error type
   * @param errorType - Type of error (expected, unexpected, unknown)
   * @returns Error source enum value
   */
  private determineErrorSource(errorType: string): ErrorSource {
    if (errorType === 'expected') {
      return ErrorSource.Validation;
    }
    return ErrorSource.Unknown;
  }

  /**
   * Normalizes unknown error types to Error instances
   * @param error - Error of unknown type
   * @returns Normalized Error instance
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}

