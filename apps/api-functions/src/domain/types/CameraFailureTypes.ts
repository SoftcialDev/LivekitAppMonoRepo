/**
 * @fileoverview CameraFailureTypes - Type definitions for camera failure reporting
 * @summary Defines types and interfaces for camera failure data structures
 * @description Encapsulates normalized representations of camera device attempts and snapshots
 */

import { CameraFailureStage } from '@prisma/client';
import { AttemptResult } from '../enums/AttemptResult';

/**
 * Normalized representation of a single device attempt outcome
 * @description Represents the result of attempting to start a camera device
 */
export interface NormalizedAttempt {
  /**
   * Device label or name
   */
  label?: string | null;

  /**
   * Hashed device identifier
   */
  deviceIdHash?: string | null;

  /**
   * Result of the attempt
   */
  result: AttemptResult;

  /**
   * Name of the error if one occurred
   */
  errorName?: string;

  /**
   * Error message if one occurred
   */
  errorMessage?: string;
}

/**
 * Normalized representation of a media device snapshot entry
 * @description Represents a camera device in the system snapshot
 */
export interface NormalizedDevice {
  /**
   * Device label or name
   */
  label: string | null;

  /**
   * Hashed device identifier
   */
  deviceIdHash: string | null;

  /**
   * Vendor identifier
   */
  vendorId?: string;

  /**
   * Product identifier
   */
  productId?: string;
}

/**
 * Camera start failure entity
 * @description Represents a camera start failure record from the database
 */
export interface CameraStartFailure {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * User ID (UUID) if user exists in database
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
  stage: CameraFailureStage;

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
   * Snapshot of devices at failure time (JSON)
   */
  devicesSnapshot: unknown | null;

  /**
   * Attempts made to start devices (JSON)
   */
  attempts: unknown | null;

  /**
   * Additional metadata (JSON)
   */
  metadata: unknown | null;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Creation timestamp in Central America timezone
   */
  createdAtCentralAmerica: string | null;
}

/**
 * Data structure for creating a new camera start failure entry
 * @description Represents the data needed to create a camera failure log
 */
export interface CreateCameraStartFailureData {
  /**
   * Azure AD Object ID of the user
   */
  userAdId: string;

  /**
   * User email address
   */
  userEmail?: string;

  /**
   * Stage where the failure occurred
   */
  stage: CameraFailureStage;

  /**
   * Error name/type
   */
  errorName?: string;

  /**
   * Error message
   */
  errorMessage?: string;

  /**
   * Number of devices detected
   */
  deviceCount?: number;

  /**
   * Snapshot of devices at failure time
   */
  devicesSnapshot?: unknown;

  /**
   * Attempts made to start devices
   */
  attempts?: unknown;

  /**
   * Additional metadata
   */
  metadata?: unknown;

  /**
   * Creation timestamp in Central America timezone
   */
  createdAtCentralAmerica: string;
}

/**
 * Query parameters for filtering camera failure logs
 * @description Represents filter criteria for querying camera failures
 */
export interface CameraFailureQueryParams {
  /**
   * Filter by failure stage
   */
  stage?: CameraFailureStage;

  /**
   * Filter by user email
   */
  userEmail?: string;

  /**
   * Filter by user Azure AD Object ID
   */
  userAdId?: string;

  /**
   * Start date for date range filter
   */
  startDate?: Date;

  /**
   * End date for date range filter
   */
  endDate?: Date;

  /**
   * Maximum number of results
   */
  limit?: number;

  /**
   * Number of results to skip
   */
  offset?: number;
}
