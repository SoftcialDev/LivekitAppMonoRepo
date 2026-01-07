/**
 * @fileoverview GetCameraFailuresResponse - Value object for camera failure query responses
 * @description Encapsulates camera failure query response data
 */

import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';

/**
 * Value object representing a response from camera failure queries
 */
export class GetCameraFailuresResponse {
  /**
   * Creates a response for a list of camera failures with total count
   * @param failures - Array of camera failure records
   * @param total - Total count of matching camera failures (before pagination)
   * @param limit - Limit used for pagination
   * @param offset - Offset used for pagination
   * @returns GetCameraFailuresResponse instance
   */
  static fromFailures(failures: any[], total: number, limit?: number, offset?: number): GetCameraFailuresResponse {
    return new GetCameraFailuresResponse(failures, total, limit, offset);
  }

  /**
   * Creates a response for a single camera failure
   * @param failure - Camera failure record
   * @returns GetCameraFailuresResponse instance
   */
  static fromFailure(failure: any): GetCameraFailuresResponse {
    return new GetCameraFailuresResponse([failure], 1);
  }

  private constructor(
    private readonly failures: any[],
    private readonly total: number = failures.length,
    private readonly limit?: number,
    private readonly offset?: number
  ) {}

  /**
   * Converts the response to a payload object
   * @returns Payload object for HTTP response
   */
  toPayload(): {
    failures: any[];
    count: number;
    total: number;
    limit?: number;
    offset?: number;
    hasMore: boolean;
  } {
    return {
      failures: this.failures,
      count: this.failures.length,
      total: this.total,
      limit: this.limit,
      offset: this.offset,
      hasMore: this.offset !== undefined && this.limit !== undefined 
        ? (this.offset + this.failures.length) < this.total 
        : false
    };
  }

  /**
   * Converts a single failure to payload (for GET by ID)
   * @returns Payload object for single camera failure
   */
  toSinglePayload(): any {
    if (this.failures.length === 0) {
      throw new ValidationError('No camera failure to convert', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }
    return this.failures[0];
  }
}

