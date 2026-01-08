/**
 * @fileoverview GetErrorLogsResponse - Value object for error log query responses
 * @description Encapsulates error log query response data
 */

import { ApiErrorLog } from '../entities/ApiErrorLog';
import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';

/**
 * Value object representing a response from error log queries
 */
export class GetErrorLogsResponse {
  /**
   * Creates a response for a list of error logs with total count
   * @param logs - Array of error log entities
   * @param total - Total count of matching error logs (before pagination)
   * @param limit - Limit used for pagination
   * @param offset - Offset used for pagination
   * @returns GetErrorLogsResponse instance
   */
  static fromLogs(logs: ApiErrorLog[], total: number, limit?: number, offset?: number): GetErrorLogsResponse {
    return new GetErrorLogsResponse(logs, total, limit, offset);
  }

  /**
   * Creates a response for a single error log
   * @param log - Error log entity
   * @returns GetErrorLogsResponse instance
   */
  static fromLog(log: ApiErrorLog): GetErrorLogsResponse {
    return new GetErrorLogsResponse([log], 1);
  }

  private constructor(
    private readonly logs: ApiErrorLog[],
    private readonly total: number = logs.length,
    private readonly limit?: number,
    private readonly offset?: number
  ) {}

  /**
   * Converts the response to a payload object
   * @returns Payload object for HTTP response
   */
  toPayload(): {
    logs: Array<{
      id: string;
      severity: string;
      source: string;
      endpoint: string | null;
      functionName: string | null;
      errorName: string | null;
      errorMessage: string | null;
      stackTrace: string | null;
      httpStatusCode: number | null;
      userId: string | null;
      userEmail: string | null;
      requestId: string | null;
      context: Record<string, unknown> | null;
      resolved: boolean;
      resolvedAt: Date | null;
      resolvedBy: string | null;
      createdAt: Date;
    }>;
    count: number;
    total: number;
    limit?: number;
    offset?: number;
    hasMore: boolean;
  } {
    return {
      logs: this.logs.map(log => ({
        id: log.id,
        severity: log.severity,
        source: log.source,
        endpoint: log.endpoint,
        functionName: log.functionName,
        errorName: log.errorName,
        errorMessage: log.errorMessage,
        stackTrace: log.stackTrace,
        httpStatusCode: log.httpStatusCode,
        userId: log.userId,
        userEmail: log.userEmail,
        requestId: log.requestId,
        context: log.context,
        resolved: log.resolved,
        resolvedAt: log.resolvedAt,
        resolvedBy: log.resolvedBy,
        createdAt: log.createdAt
      })),
      count: this.logs.length,
      total: this.total,
      limit: this.limit,
      offset: this.offset,
      hasMore: this.offset !== undefined && this.limit !== undefined 
        ? (this.offset + this.logs.length) < this.total 
        : false
    };
  }

  /**
   * Converts a single log to payload (for GET by ID)
   * @returns Payload object for single error log
   */
  toSinglePayload(): {
    id: string;
    severity: string;
    source: string;
    endpoint: string | null;
    functionName: string | null;
    errorName: string | null;
    errorMessage: string | null;
    stackTrace: string | null;
    httpStatusCode: number | null;
    userId: string | null;
    userEmail: string | null;
    requestId: string | null;
    context: Record<string, unknown> | null;
    resolved: boolean;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    createdAt: Date;
  } {
    if (this.logs.length === 0) {
      throw new ValidationError('No error log to convert', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }
    const log = this.logs[0];
    return {
      id: log.id,
      severity: log.severity,
      source: log.source,
      endpoint: log.endpoint,
      functionName: log.functionName,
      errorName: log.errorName,
      errorMessage: log.errorMessage,
      stackTrace: log.stackTrace,
      httpStatusCode: log.httpStatusCode,
      userId: log.userId,
      userEmail: log.userEmail,
      requestId: log.requestId,
      context: log.context,
      resolved: log.resolved,
      resolvedAt: log.resolvedAt,
      resolvedBy: log.resolvedBy,
      createdAt: log.createdAt
    };
  }
}

