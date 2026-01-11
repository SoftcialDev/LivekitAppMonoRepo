/**
 * @fileoverview Type definitions for Camera Failure page
 * @summary Interfaces for camera failure page configuration
 * @description Defines interfaces used in camera failure page configuration
 */

import type { CameraFailureReport } from '../../types/cameraFailureTypes';

/**
 * Handlers required for camera failure columns
 */
export interface ICameraFailureColumnHandlers {
  /**
   * Handler for viewing camera failure details
   */
  handleViewDetails: (failure: CameraFailureReport) => void;
}

