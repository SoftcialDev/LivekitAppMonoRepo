/**
 * @fileoverview Camera Failure type definitions
 * @summary Type definitions for camera failure reports
 * @description Defines interfaces and types for camera failure reports
 */

import type { CameraFailureStage } from '../enums/cameraFailureStage';

/**
 * Normalized device snapshot entry
 */
export interface NormalizedDevice {
  label: string | null;
  deviceIdHash: string | null;
  vendorId?: string;
  productId?: string;
  groupId?: string;
  deviceId?: string;
}

/**
 * Normalized attempt entry
 */
export interface NormalizedAttempt {
  label?: string | null;
  deviceIdHash?: string | null;
  deviceId?: string;
  result?: string;
  errorName?: string;
  errorMessage?: string;
}

/**
 * Camera failure report returned by the API
 */
export interface CameraFailureReport {
  /**
   * Unique identifier for the camera failure
   */
  id: string;

  /**
   * User ID if user exists in database
   */
  userId: string | null;

  /**
   * Azure AD Object ID of the user
   */
  userAdId: string;

  /**
   * User email address
   */
  userEmail: string | null;

  /**
   * Stage where the failure occurred
   */
  stage: CameraFailureStage | string;

  /**
   * Error name/type
   */
  errorName: string | null;

  /**
   * Error message
   */
  errorMessage: string | null;

  /**
   * Number of devices detected
   */
  deviceCount: number | null;

  /**
   * Devices snapshot array
   */
  devicesSnapshot: NormalizedDevice[] | null;

  /**
   * Attempts array
   */
  attempts: NormalizedAttempt[] | null;

  /**
   * Additional metadata
   */
  metadata: Record<string, unknown> | null;

  /**
   * ISO-8601 timestamp when the failure was created
   */
  createdAt: string;

  /**
   * Created at in Central America timezone
   */
  createdAtCentralAmerica: string | null;
}

/**
 * Query parameters for fetching camera failures
 */
export interface CameraFailureQueryParams {
  stage?: CameraFailureStage | string;
  userEmail?: string;
  userAdId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Response from getCameraFailures API
 */
export interface GetCameraFailuresResponse {
  /**
   * Array of camera failure reports
   */
  failures: CameraFailureReport[];

  /**
   * Number of failures in current response
   */
  count: number;

  /**
   * Total number of failures matching the query
   */
  total: number;

  /**
   * Limit used for pagination
   */
  limit?: number;

  /**
   * Offset used for pagination
   */
  offset?: number;

  /**
   * Whether there are more results
   */
  hasMore: boolean;
}

