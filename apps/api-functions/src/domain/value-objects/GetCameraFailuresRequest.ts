/**
 * @fileoverview GetCameraFailuresRequest - Value object for camera failure query requests
 * @description Encapsulates camera failure query parameters
 */

import { CameraFailureStage } from '@prisma/client';
import { CameraFailureQueryParams } from '../types/CameraFailureTypes';

/**
 * Value object representing a request to query camera failures
 */
export class GetCameraFailuresRequest {
  public readonly stage?: CameraFailureStage;
  public readonly userEmail?: string;
  public readonly userAdId?: string;
  public readonly startDate?: Date;
  public readonly endDate?: Date;
  public readonly limit?: number;
  public readonly offset?: number;

  /**
   * Creates a new GetCameraFailuresRequest instance
   * @param params - Query parameters
   */
  private constructor(params: {
    stage?: CameraFailureStage;
    userEmail?: string;
    userAdId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    this.stage = params.stage;
    this.userEmail = params.userEmail;
    this.userAdId = params.userAdId;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.limit = params.limit;
    this.offset = params.offset;
  }

  /**
   * Creates a GetCameraFailuresRequest from query parameters
   * @param query - Query parameters object
   * @returns GetCameraFailuresRequest instance
   */
  static fromQuery(query: Record<string, any>): GetCameraFailuresRequest {
    const params: any = {};

    if (query.stage) {
      params.stage = query.stage as CameraFailureStage;
    }

    if (query.userEmail) {
      params.userEmail = query.userEmail;
    }

    if (query.userAdId) {
      params.userAdId = query.userAdId;
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

    return new GetCameraFailuresRequest(params);
  }

  /**
   * Converts the request to CameraFailureQueryParams for repository
   * @returns CameraFailureQueryParams object
   */
  toQueryParams(): CameraFailureQueryParams {
    return {
      stage: this.stage,
      userEmail: this.userEmail,
      userAdId: this.userAdId,
      startDate: this.startDate,
      endDate: this.endDate,
      limit: this.limit,
      offset: this.offset
    };
  }
}

