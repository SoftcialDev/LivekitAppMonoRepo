/**
 * @fileoverview ErrorTypeClassifier - Classifies error types and determines logging behavior
 * @summary Utility for classifying errors and determining severity
 * @description Classifies errors as expected (4xx) or unexpected (5xx) and determines appropriate severity
 */

import { ExpectedError } from "../../middleware/errorHandler";
import { ErrorSeverity } from "../../domain/enums/ErrorSeverity";
import { AuthError, ValidationError, MessagingError } from "../../domain/errors/DomainError";

/**
 * Classification result for an error
 */
export interface ErrorClassification {
  type: 'expected' | 'unexpected' | 'unknown';
  statusCode: number;
  shouldLog: boolean;
  severity: ErrorSeverity;
}

/**
 * Classifies error types and determines logging behavior
 * @description Provides a single responsibility for error classification and severity determination
 */
export class ErrorTypeClassifier {
  /**
   * Classifies an error and determines its logging behavior
   * @param error - Error to classify
   * @returns Error classification with type, status code, logging flag, and severity
   */
  static classify(error: unknown): ErrorClassification {
    if (error instanceof ExpectedError) {
      return {
        type: 'expected',
        statusCode: error.statusCode,
        shouldLog: true,
        severity: this.determineSeverity(error.statusCode)
      };
    }

    if (error instanceof AuthError || error instanceof ValidationError || error instanceof MessagingError) {
      return {
        type: 'expected',
        statusCode: error.statusCode,
        shouldLog: true,
        severity: this.determineSeverity(error.statusCode)
      };
    }

    if (error instanceof Error) {
      return {
        type: 'unexpected',
        statusCode: 500,
        shouldLog: true,
        severity: ErrorSeverity.Critical
      };
    }

    return {
      type: 'unknown',
      statusCode: 500,
      shouldLog: true,
      severity: ErrorSeverity.High
    };
  }

  /**
   * Determines error severity based on HTTP status code
   * @param statusCode - HTTP status code
   * @returns Appropriate error severity level
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

