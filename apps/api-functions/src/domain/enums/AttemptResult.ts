/**
 * @fileoverview AttemptResult - Enum for camera device attempt outcomes
 * @summary Defines canonical result values for per-device attempt outcomes during camera start
 * @description Enum representing the different possible outcomes when attempting to start a camera device
 */

/**
 * Canonical result values for per-device attempt outcomes during camera start
 * @description Defines the possible outcomes when attempting to access a camera device
 */
export enum AttemptResult {
  /**
   * Device was successfully accessed
   * @description Camera device started without errors
   */
  OK = 'ok',

  /**
   * Device is not readable (NotReadableError)
   * @description Device exists but cannot be read or accessed
   */
  NotReadableError = 'NotReadableError',

  /**
   * Other error occurred
   * @description Generic error category for errors that don't fit other categories
   */
  Other = 'other',
}

