/**
 * @fileoverview Camera Failure page constants
 * @summary Constants for camera failure report page styling
 * @description Defines styling constants for camera failure report columns
 */

/**
 * Cell styling classes for camera failure report columns
 */
export const CAMERA_FAILURE_CELL_CLASSES = {
  STAGE: 'font-medium',
  USER_EMAIL: 'break-all',
  USER_AD_ID: 'break-all',
  ERROR_NAME: 'break-words',
  ERROR_MESSAGE: 'wrap-break-word max-w-md',
  DEVICE_COUNT: 'text-center',
  CREATED_AT: 'whitespace-nowrap',
} as const;

