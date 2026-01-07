/**
 * @fileoverview GetErrorLogsRequest - Value object for error log query requests
 * @description Encapsulates error log query parameters
 */

import { ErrorSource } from '../enums/ErrorSource';
import { ErrorSeverity } from '../enums/ErrorSeverity';
import { ErrorLogQueryParams } from '../types/ErrorLogTypes';

/**
 * Value object representing a request to query error logs
 */
export class GetErrorLogsRequest {
  public readonly source?: ErrorSource;
  public readonly severity?: ErrorSeverity;
  public readonly endpoint?: string;
  public readonly resolved?: boolean;
  public readonly startDate?: Date;
  public readonly endDate?: Date;
  public readonly limit?: number;
  public readonly offset?: number;

  /**
   * Creates a new GetErrorLogsRequest instance
   * @param params - Query parameters
   */
  private constructor(params: {
    source?: ErrorSource;
    severity?: ErrorSeverity;
    endpoint?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    this.source = params.source;
    this.severity = params.severity;
    this.endpoint = params.endpoint;
    this.resolved = params.resolved;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.limit = params.limit;
    this.offset = params.offset;
  }

  /**
   * Creates a GetErrorLogsRequest from query parameters
   * @param query - Query parameters object
   * @returns GetErrorLogsRequest instance
   */
  static fromQuery(query: Record<string, any>): GetErrorLogsRequest {
    const params: any = {};

    if (query.source) {
      params.source = query.source as ErrorSource;
    }

    if (query.severity) {
      params.severity = query.severity as ErrorSeverity;
    }

    if (query.endpoint) {
      params.endpoint = query.endpoint;
    }

    if (query.resolved !== undefined && query.resolved !== null) {
      params.resolved = query.resolved === 'true' || query.resolved === true;
    }

    if (query.startDate) {
      params.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      params.endDate = new Date(query.endDate);
    }

    if (query.limit) {
      params.limit = parseInt(String(query.limit), 10);
    }

    if (query.offset) {
      params.offset = parseInt(String(query.offset), 10);
    }

    return new GetErrorLogsRequest(params);
  }

  /**
   * Converts the request to ErrorLogQueryParams for repository
   * @returns ErrorLogQueryParams object
   */
  toQueryParams(): ErrorLogQueryParams {
    return {
      source: this.source,
      severity: this.severity,
      endpoint: this.endpoint,
      resolved: this.resolved,
      startDate: this.startDate,
      endDate: this.endDate,
      limit: this.limit,
      offset: this.offset
    };
  }
}

