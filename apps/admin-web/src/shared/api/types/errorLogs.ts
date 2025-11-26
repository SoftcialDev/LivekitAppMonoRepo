/**
 * @fileoverview errorLogs types - Type definitions for error logs
 * @description Type definitions for error log enums and interfaces
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

/**
 * Error source types
 */
export enum ErrorSource {
  ChatService = 'ChatService',
  BlobStorage = 'BlobStorage',
  Database = 'Database',
  Authentication = 'Authentication',
  Validation = 'Validation',
  Unknown = 'Unknown',
}

