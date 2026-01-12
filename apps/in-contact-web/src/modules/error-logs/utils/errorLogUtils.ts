/**
 * @fileoverview Error log utility functions
 * @summary Reusable utilities for error log operations
 * @description Common utility functions for formatting and manipulating error log data.
 * These utilities are used across error log components to ensure consistent behavior.
 */

import type { ErrorLog } from '../types/errorLogsTypes';
import { formatDateForDisplay } from '@/shared/utils/time';

/**
 * Formats an error log to a string representation for clipboard copying
 * 
 * Creates a formatted text representation of an error log entry suitable
 * for copying to clipboard. Includes all relevant fields in a readable format.
 * 
 * @param errorLog - Error log entry to format
 * @returns Formatted string representation of the error log
 * 
 * @example
 * ```typescript
 * const formatted = formatErrorLogForClipboard(errorLog);
 * await navigator.clipboard.writeText(formatted);
 * ```
 */
export function formatErrorLogForClipboard(errorLog: ErrorLog): string {
  return `ID: ${errorLog.id}
Severity: ${errorLog.severity}
Source: ${errorLog.source}
Error: ${errorLog.errorName}
Message: ${errorLog.errorMessage}
User Email: ${errorLog.userEmail || 'N/A'}
Endpoint: ${errorLog.endpoint || 'N/A'}
Function: ${errorLog.functionName || 'N/A'}
Status Code: ${errorLog.httpStatusCode || 'N/A'}
Resolved: ${errorLog.resolved ? 'Yes' : 'No'}
Created: ${formatDateForDisplay(errorLog.createdAt)}
${errorLog.stackTrace ? '\nStack Trace:\n' + errorLog.stackTrace : ''}`;
}

/**
 * Copies error log details to clipboard
 * 
 * Formats the error log and attempts to copy it to the clipboard.
 * Silently fails if the clipboard API is not available.
 * 
 * @param errorLog - Error log entry to copy
 * @returns Promise that resolves when copy operation completes (or fails silently)
 * 
 * @example
 * ```typescript
 * await copyErrorLogToClipboard(errorLog);
 * // Error log details copied to clipboard
 * ```
 */
export async function copyErrorLogToClipboard(errorLog: ErrorLog): Promise<void> {
  const formatted = formatErrorLogForClipboard(errorLog);
  try {
    await navigator.clipboard.writeText(formatted);
  } catch {
    // Silently fail if clipboard API is not available
  }
}

