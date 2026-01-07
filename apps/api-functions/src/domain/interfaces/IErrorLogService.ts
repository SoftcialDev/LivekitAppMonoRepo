/**
 * @fileoverview IErrorLogService - Interface for error logging operations
 * @description Defines the contract for error logging service operations
 */

import { ErrorSeverity } from '../enums/ErrorSeverity';
import { ErrorSource } from '../enums/ErrorSource';

/**
 * Interface for error logging service operations
 */
export interface IErrorLogService {
  /**
   * Logs an error with full context information
   * @param data - Error logging data including severity, source, and error details
   * @returns Promise that resolves when the error is logged
   * @throws Error if the logging operation fails (should not break main flow)
   */
  logError(data: {
    severity?: ErrorSeverity;
    source: ErrorSource;
    endpoint?: string;
    functionName?: string;
    error: Error | unknown;
    userId?: string;
    userEmail?: string;
    requestId?: string;
    context?: Record<string, unknown>;
    httpStatusCode?: number;
  }): Promise<void>;

  /**
   * Logs an error specifically from chat service operations
   * Automatically sets source to ChatService and determines appropriate severity
   * @param data - Chat service error data including endpoint, function, and error details
   * @returns Promise that resolves when the error is logged
   * @throws Error if the logging operation fails (should not break main flow)
   */
  logChatServiceError(data: {
    endpoint: string;
    functionName: string;
    error: Error | unknown;
    userId?: string;
    userEmail?: string;
    chatId?: string;
    context?: Record<string, unknown>;
  }): Promise<void>;
}

