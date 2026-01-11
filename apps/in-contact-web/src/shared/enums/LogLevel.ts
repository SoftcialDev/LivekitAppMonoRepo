/**
 * @fileoverview LogLevel - Enumeration for log levels
 * @summary Defines the available log levels for structured logging
 * @description Enumeration of log levels used throughout the application for
 * consistent logging behavior and filtering
 */

/**
 * Log level enumeration
 * 
 * Defines the available log levels in order of severity. Used by the logger
 * to filter logs based on the configured minimum level.
 * 
 * Levels in order of severity (lowest to highest):
 * - DEBUG: Detailed debugging information (development only)
 * - INFO: General informational messages
 * - WARN: Warning messages for potential issues
 * - ERROR: Error messages for failures and exceptions
 */
export enum LogLevel {
  /** Detailed debugging information, typically disabled in production */
  DEBUG = 'debug',
  
  /** General informational messages about application flow */
  INFO = 'info',
  
  /** Warning messages indicating potential issues or unexpected behavior */
  WARN = 'warn',
  
  /** Error messages for failures, exceptions, and critical issues */
  ERROR = 'error',
}

/**
 * Numeric values for log levels (used for comparison and filtering)
 * Lower values indicate less severe logs, higher values indicate more severe logs
 */
export const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
} as const;

