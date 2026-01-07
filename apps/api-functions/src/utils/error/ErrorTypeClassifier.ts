/**
 * @fileoverview ErrorTypeClassifier - Classifies error types
 */

import { ExpectedError } from '../../index';
import { ErrorSeverity } from '../../index';
import { AuthError, ValidationError, MessagingError } from '../../index';

export interface ErrorClassification {
  type: 'expected' | 'unexpected' | 'unknown';
  statusCode: number;
  shouldLog: boolean;
  severity: ErrorSeverity;
}

export class ErrorTypeClassifier {
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

