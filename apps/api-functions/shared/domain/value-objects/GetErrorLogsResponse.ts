/**
 * @fileoverview GetErrorLogsResponse - Value object for error log query responses
 * @description Encapsulates error log query response data
 */

import { ApiErrorLog } from '../entities/ApiErrorLog';

/**
 * Value object representing a response from error log queries
 */
export class GetErrorLogsResponse {
  /**
   * Creates a response for a list of error logs
   * @param logs - Array of error log entities
   * @returns GetErrorLogsResponse instance
   */
  static fromLogs(logs: ApiErrorLog[]): GetErrorLogsResponse {
    return new GetErrorLogsResponse(logs);
  }

  /**
   * Creates a response for a single error log
   * @param log - Error log entity
   * @returns GetErrorLogsResponse instance
   */
  static fromLog(log: ApiErrorLog): GetErrorLogsResponse {
    return new GetErrorLogsResponse([log]);
  }

  private constructor(private readonly logs: ApiErrorLog[]) {}

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
      errorMessage: string;
      stackTrace: string | null;
      httpStatusCode: number | null;
      userId: string | null;
      requestId: string | null;
      context: Record<string, unknown> | null;
      resolved: boolean;
      resolvedAt: Date | null;
      resolvedBy: string | null;
      createdAt: Date;
    }>;
    count: number;
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
        requestId: log.requestId,
        context: log.context,
        resolved: log.resolved,
        resolvedAt: log.resolvedAt,
        resolvedBy: log.resolvedBy,
        createdAt: log.createdAt
      })),
      count: this.logs.length
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
    errorMessage: string;
    stackTrace: string | null;
    httpStatusCode: number | null;
    userId: string | null;
    requestId: string | null;
    context: Record<string, unknown> | null;
    resolved: boolean;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    createdAt: Date;
  } {
    if (this.logs.length === 0) {
      throw new Error('No error log to convert');
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
      requestId: log.requestId,
      context: log.context,
      resolved: log.resolved,
      resolvedAt: log.resolvedAt,
      resolvedBy: log.resolvedBy,
      createdAt: log.createdAt
    };
  }
}

