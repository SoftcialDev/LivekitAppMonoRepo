/**
 * @fileoverview Component Types
 * @summary Type definitions for camera failure detail components
 * @description Defines interfaces for camera failure detail component props
 */

import type { NormalizedDevice, NormalizedAttempt, CameraFailureReport } from '../../../types/cameraFailureTypes';

/**
 * Props for DeviceItem component
 */
export interface IDeviceItemProps {
  /**
   * Device data to display
   */
  device: NormalizedDevice;

  /**
   * Index of the device in the list
   */
  index: number;
}

/**
 * Props for AttemptItem component
 */
export interface IAttemptItemProps {
  /**
   * Attempt data to display
   */
  attempt: NormalizedAttempt;

  /**
   * Index of the attempt in the list
   */
  index: number;
}

/**
 * Props for DevicesSection component
 */
export interface IDevicesSectionProps {
  /**
   * Array of devices to display
   */
  devices: NormalizedDevice[];
}

/**
 * Props for AttemptsSection component
 */
export interface IAttemptsSectionProps {
  /**
   * Array of attempts to display
   */
  attempts: NormalizedAttempt[];
}

/**
 * Props for MetadataSection component
 */
export interface IMetadataSectionProps {
  /**
   * Metadata object to display
   */
  metadata: Record<string, unknown> | null | undefined;
}

/**
 * Props for FailureDetailsContent component
 */
export interface IFailureDetailsContentProps {
  /**
   * Failure report to display
   */
  failure: CameraFailureReport;
}

