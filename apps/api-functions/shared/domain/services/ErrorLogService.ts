/**
 * @fileoverview ErrorLogService - Domain service for error logging operations
 * @summary Handles error logging business logic
 * @description Contains the core business logic for logging API errors
 */

import { IErrorLogService } from '../interfaces/IErrorLogService';
import { IErrorLogRepository } from '../interfaces/IErrorLogRepository';
import { ErrorSeverity } from '../enums/ErrorSeverity';
import { ErrorSource } from '../enums/ErrorSource';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain service for error logging business logic
 * @description Handles the core business rules for logging API errors
 */
export class ErrorLogService implements IErrorLogService {
  /**
   * Creates a new ErrorLogService instance
   * @param errorLogRepository - Repository for error log data access
   */
  constructor(
    private readonly errorLogRepository: IErrorLogRepository
  ) {}

  /**
   * Logs an error with full context information
   * @param data - Error logging data including severity, source, and error details
   * @returns Promise that resolves when the error is logged
   */
  async logError(data: {
    severity?: ErrorSeverity;
    source: ErrorSource;
    endpoint?: string;
    functionName?: string;
    error: Error | unknown;
    userId?: string;
    requestId?: string;
    context?: Record<string, unknown>;
    httpStatusCode?: number;
  }): Promise<void> {
    try {
      const { errorName, errorMessage, stackTrace } = this.extractErrorDetails(data.error);
      const severity = data.severity || this.determineSeverity(data.source, data.error);

      await this.errorLogRepository.create({
        severity,
        source: data.source,
        endpoint: data.endpoint,
        functionName: data.functionName,
        errorName: errorName || undefined,
        errorMessage,
        stackTrace: stackTrace || undefined,
        httpStatusCode: data.httpStatusCode,
        userId: data.userId,
        requestId: data.requestId,
        context: data.context
      });
    } catch (logError) {
      console.error('[ErrorLogService] Failed to persist error log', {
        originalError: data.error,
        logError: logError instanceof Error ? logError.message : String(logError)
      });
    }
  }

  /**
   * Logs an error specifically from chat service operations
   * Automatically sets source to ChatService and determines appropriate severity
   * @param data - Chat service error data including endpoint, function, and error details
   * @returns Promise that resolves when the error is logged
   */
  async logChatServiceError(data: {
    endpoint: string;
    functionName: string;
    error: Error | unknown;
    userId?: string;
    chatId?: string;
    context?: Record<string, unknown>;
  }): Promise<void> {
    await this.logError({
      source: ErrorSource.ChatService,
      endpoint: data.endpoint,
      functionName: data.functionName,
      error: data.error,
      userId: data.userId,
      context: {
        ...data.context,
        chatId: data.chatId
      }
    });
  }

  /**
   * Extracts error details from an error object
   * @param error - Error object or unknown type
   * @returns Object containing error name, message, and stack trace
   */
  private extractErrorDetails(error: Error | unknown): {
    errorName: string | null;
    errorMessage: string;
    stackTrace: string | null;
  } {
    if (error instanceof Error) {
      return {
        errorName: error.name || null,
        errorMessage: error.message || 'Unknown error',
        stackTrace: error.stack || null
      };
    }

    if (typeof error === 'string') {
      return {
        errorName: null,
        errorMessage: error,
        stackTrace: null
      };
    }

    try {
      const errorString = JSON.stringify(error);
      return {
        errorName: null,
        errorMessage: errorString,
        stackTrace: null
      };
    } catch {
      return {
        errorName: null,
        errorMessage: 'Unknown error (could not serialize)',
        stackTrace: null
      };
    }
  }

  /**
   * Determines the appropriate severity level based on source and error type
   * @param source - Error source
   * @param error - Error object
   * @returns Determined severity level
   */
  private determineSeverity(source: ErrorSource, error: Error | unknown): ErrorSeverity {
    if (error instanceof Error) {
      const errorName = error.name?.toLowerCase() || '';
      const errorMessage = error.message?.toLowerCase() || '';

      if (errorName.includes('timeout') || errorName.includes('network')) {
        return ErrorSeverity.Medium;
      }

      if (errorName.includes('authentication') || errorName.includes('unauthorized')) {
        return ErrorSeverity.High;
      }

      if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
        return ErrorSeverity.Critical;
      }
    }

    if (source === ErrorSource.Authentication) {
      return ErrorSeverity.High;
    }

    if (source === ErrorSource.Database) {
      return ErrorSeverity.Critical;
    }

    return ErrorSeverity.Medium;
  }
}

