/**
 * @fileoverview ErrorTypeClassifier - Classifies error types
 * @summary Utility class for classifying and categorizing errors
 * @description Provides error classification logic to determine error type, HTTP status code,
 * logging requirements, and severity based on error instance type
 */

import { ExpectedError } from '../../middleware/errorHandler';
import { ErrorSeverity } from '../../domain/enums/ErrorSeverity';
import { ErrorType } from '../../domain/enums/ErrorType';
import { DomainError } from '../../domain/errors';
import { ErrorClassification } from '../../domain/types/ErrorTypes';

/**
 * Utility class for classifying errors
 * @description Provides static methods to classify errors and determine their handling characteristics
 */
export class ErrorTypeClassifier {
  /**
   * Classifies an error and determines its characteristics
   * @description Analyzes the error type and returns classification including status code,
   * logging requirements, and severity. ExpectedError and domain errors (DomainError and subclasses)
   * are classified as 'expected', Error instances as 'unexpected', and other types as 'unknown'.
   * @param error - Unknown error to classify
   * @returns ErrorClassification with type, statusCode, shouldLog, and severity
   * @example
   * const classification = ErrorTypeClassifier.classify(error);
   * if (classification.type === 'expected') {
   *   // Handle as client error
   * }
   */
  static classify(error: unknown): ErrorClassification {
    if (error instanceof ExpectedError) {
      return {
        type: ErrorType.Expected,
        statusCode: error.statusCode,
        shouldLog: true,
        severity: this.determineSeverity(error.statusCode)
      };
    }

    if (error instanceof DomainError) {
      return {
        type: ErrorType.Expected,
        statusCode: error.statusCode,
        shouldLog: true,
        severity: this.determineSeverity(error.statusCode)
      };
    }

    if (error instanceof Error) {
      return {
        type: ErrorType.Unexpected,
        statusCode: 500,
        shouldLog: true,
        severity: ErrorSeverity.Critical
      };
    }

    return {
      type: ErrorType.Unknown,
      statusCode: 500,
      shouldLog: true,
      severity: ErrorSeverity.High
    };
  }

  /**
   * Determines error severity based on HTTP status code
   * @description Maps HTTP status codes to ErrorSeverity levels:
   * - 500+ → Critical
   * - 400-499 → Medium
   * - Other → Low
   * @param statusCode - HTTP status code
   * @returns ErrorSeverity level
   */
  private static determineSeverity(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) {
      return ErrorSeverity.Critical;
    }
    if (statusCode >= 400) {
      return ErrorSeverity.Medium;
    }
    return ErrorSeverity.Low;
  }
}

