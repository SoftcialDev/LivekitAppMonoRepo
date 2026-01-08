/**
 * @fileoverview standaloneLogger - Structured logging utilities for standalone scripts
 * @summary Provides logging functions that don't require Azure Functions context
 * @description Used by standalone scripts (seed, migrations, etc.) for structured logging
 */

/**
 * Logs an informational message to stdout
 * @param message - Message to log
 * @param props - Additional structured properties
 */
export function logInfo(message: string, props?: Record<string, unknown>): void {
  const logEntry = {
    level: 'INFO',
    message,
    timestamp: new Date().toISOString(),
    ...props
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Logs a warning message to stdout
 * @param message - Warning message to log
 * @param props - Additional structured properties
 */
export function logWarn(message: string, props?: Record<string, unknown>): void {
  const logEntry = {
    level: 'WARN',
    message,
    timestamp: new Date().toISOString(),
    ...props
  };
  console.warn(JSON.stringify(logEntry));
}

/**
 * Logs an error to stderr
 * @param error - Error to log
 * @param props - Additional structured properties
 */
export function logError(error: unknown, props?: Record<string, unknown>): void {
  const logEntry: Record<string, unknown> = {
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    ...props
  };

  if (error instanceof Error) {
    logEntry.message = error.message;
    logEntry.stack = error.stack;
  } else if (typeof error === 'string') {
    logEntry.message = error;
  } else {
    logEntry.message = String(error);
    logEntry.error = error;
  }

  console.error(JSON.stringify(logEntry));
}

