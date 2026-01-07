/**
 * @fileoverview ErrorSeverity - Enumeration for error severity levels
 * @description Defines severity levels for API error logging
 */

/**
 * Error severity levels for categorizing and prioritizing errors
 */
export enum ErrorSeverity {
  /** Low severity - Minor issues that don't affect core functionality */
  Low = 'Low',
  /** Medium severity - Standard errors that may impact user experience */
  Medium = 'Medium',
  /** High severity - Significant errors that affect functionality */
  High = 'High',
  /** Critical severity - Critical errors that require immediate attention */
  Critical = 'Critical'
}

