/**
 * @fileoverview Error logs enumerations
 * @description Domain enumerations for error logs module
 */

/**
 * Error severity levels
 * 
 * Represents the severity classification of an error log entry.
 * Used to categorize errors from lowest to highest impact.
 */
export enum ErrorSeverity {
  /** Low severity - Minor issues with minimal impact */
  Low = 'Low',
  
  /** Medium severity - Moderate issues that may affect functionality */
  Medium = 'Medium',
  
  /** High severity - Significant issues that impact core functionality */
  High = 'High',
  
  /** Critical severity - Critical issues that require immediate attention */
  Critical = 'Critical',
}

/**
 * Error source types
 * 
 * Represents the origin or component where the error occurred.
 * Used to categorize errors by their source system or service.
 */
export enum ErrorSource {
  /** Errors originating from chat service operations */
  ChatService = 'ChatService',
  
  /** Errors originating from blob storage operations */
  BlobStorage = 'BlobStorage',
  
  /** Errors originating from database operations */
  Database = 'Database',
  
  /** Errors originating from authentication processes */
  Authentication = 'Authentication',
  
  /** Errors originating from data validation */
  Validation = 'Validation',
  
  /** Errors originating from recording operations */
  Recording = 'Recording',
  
  /** Unknown or unclassified error source */
  Unknown = 'Unknown',
}
