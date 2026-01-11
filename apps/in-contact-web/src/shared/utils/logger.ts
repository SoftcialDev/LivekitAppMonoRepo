/**
 * @fileoverview Structured logging utilities for frontend application
 * @summary Provides consistent logging interface with environment-aware output
 * @description Centralizes logging functionality with structured output and
 * automatic filtering based on environment. In production, only error-level
 * logs are output by default to reduce noise and improve performance.
 * 
 * All logging functions accept structured properties for better observability
 * and easier debugging. Logs include timestamps and are formatted consistently.
 */

import { LogLevel, LOG_LEVEL_VALUES } from '../enums/LogLevel';
import type { ILoggerConfig } from '../types/loggerTypes';

/**
 * Current logger configuration
 * 
 * Automatically configured based on environment:
 * - Development: All log levels enabled (DEBUG and above)
 * - Production: Only error-level logs enabled
 */
const loggerConfig: ILoggerConfig = {
  enabled: !import.meta.env.PROD,
  level: import.meta.env.PROD ? LogLevel.ERROR : LogLevel.DEBUG,
};

/**
 * Determines if a log entry at the given level should be output
 * 
 * Checks both whether logging is enabled and if the provided level
 * meets the minimum configured log level threshold.
 * 
 * @param level - Log level to check
 * @returns True if the log should be output, false otherwise
 */
function shouldLog(level: LogLevel): boolean {
  if (!loggerConfig.enabled) {
    return false;
  }
  return LOG_LEVEL_VALUES[level] >= LOG_LEVEL_VALUES[loggerConfig.level];
}

/**
 * Formats and outputs a structured log entry
 * 
 * Creates a timestamped log entry and outputs it using the appropriate
 * console method based on the log level. The log includes the timestamp,
 * level, message, and any additional structured properties.
 * 
 * @remarks
 * This function is the only place in the codebase where console.* methods
 * should be used directly. All other code should use the exported logging
 * functions (logInfo, logWarn, logError, logDebug) instead.
 * 
 * @param level - Log level for this entry
 * @param message - Log message to output
 * @param props - Optional structured properties to include with the log
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  props?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  
  // Use appropriate console method based on level
  // This is the only place where console.* is used directly
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`[${timestamp}] [DEBUG]`, message, props || '');
      break;
    case LogLevel.INFO:
      console.info(`[${timestamp}] [INFO]`, message, props || '');
      break;
    case LogLevel.WARN:
      console.warn(`[${timestamp}] [WARN]`, message, props || '');
      break;
    case LogLevel.ERROR:
      console.error(`[${timestamp}] [ERROR]`, message, props || '');
      break;
  }
}

/**
 * Logs an informational message with optional structured properties
 * 
 * Use this for general information about application flow, user actions,
 * or successful operations that are worth tracking. These logs are visible
 * in development but filtered out in production (unless explicitly enabled).
 * 
 * @param message - Informational message to log
 * @param props - Optional structured properties to include with the log entry
 * @returns void
 * 
 * @example
 * ```typescript
 * logInfo('User logged in successfully', { 
 *   userId: '123', 
 *   email: 'user@example.com' 
 * });
 * ```
 */
export function logInfo(message: string, props?: Record<string, unknown>): void {
  if (shouldLog(LogLevel.INFO)) {
    formatLogEntry(LogLevel.INFO, message, props);
  }
}

/**
 * Logs a warning message with optional structured properties
 * 
 * Use this for situations that are not errors but might indicate potential
 * issues or unexpected behavior. Warning logs are typically visible in both
 * development and production environments (unless logging is completely disabled).
 * 
 * @param message - Warning message to log
 * @param props - Optional structured properties to include with the log entry
 * @returns void
 * 
 * @example
 * ```typescript
 * logWarn('Token retrieval failed, continuing without authentication', { 
 *   error: error.message,
 *   url: '/api/protected-endpoint'
 * });
 * ```
 */
export function logWarn(message: string, props?: Record<string, unknown>): void {
  if (shouldLog(LogLevel.WARN)) {
    formatLogEntry(LogLevel.WARN, message, props);
  }
}

/**
 * Logs an error message with optional structured properties
 * 
 * Use this for errors, exceptions, and failures. If an Error instance is provided,
 * its message, name, and stack trace are automatically extracted and included in
 * the log entry. Error logs are always enabled (even in production) to ensure
 * critical issues are tracked.
 * 
 * @param error - Error instance, error message string, or other error value
 * @param props - Optional structured properties to include with the log entry
 * @returns void
 * 
 * @example
 * ```typescript
 * // With Error instance
 * logError(new Error('API request failed'), { 
 *   endpoint: '/api/users',
 *   statusCode: 500,
 *   userId: '123'
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // With error message string
 * logError('Failed to process payment', { 
 *   orderId: '12345', 
 *   amount: 99.99 
 * });
 * ```
 */
export function logError(
  error: unknown,
  props?: Record<string, unknown>
): void {
  if (shouldLog(LogLevel.ERROR)) {
    if (error instanceof Error) {
      formatLogEntry(LogLevel.ERROR, error.message, {
        stack: error.stack,
        name: error.name,
        ...props,
      });
    } else if (typeof error === 'string') {
      formatLogEntry(LogLevel.ERROR, error, props);
    } else {
      formatLogEntry(LogLevel.ERROR, 'Unknown error occurred', {
        error: JSON.stringify(error),
        ...props,
      });
    }
  }
}

/**
 * Logs a debug message with optional structured properties
 * 
 * Use this for detailed debugging information that is only relevant during
 * development. Debug logs are automatically disabled in production to avoid
 * performance overhead and reduce log volume. These logs provide the most
 * granular level of detail for troubleshooting during development.
 * 
 * @param message - Debug message to log
 * @param props - Optional structured properties to include with the log entry
 * @returns void
 * 
 * @example
 * ```typescript
 * logDebug('Processing API request', { 
 *   method: 'GET',
 *   url: '/api/data',
 *   headers: { 'Authorization': 'Bearer ...' },
 *   requestId: 'req-123'
 * });
 * ```
 */
export function logDebug(message: string, props?: Record<string, unknown>): void {
  if (shouldLog(LogLevel.DEBUG)) {
    formatLogEntry(LogLevel.DEBUG, message, props);
  }
}

