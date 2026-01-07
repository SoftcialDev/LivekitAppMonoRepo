/**
 * @fileoverview HealthStatus - Enum for health check status values
 * @summary Defines health status enumeration values
 * @description Enum representing the possible health status values in the system
 */

/**
 * Health status enumeration
 * @description Represents the possible states of a health check
 */
export enum HealthStatus {
  /**
   * System is healthy
   * @description All checks passed successfully
   */
  OK = 'ok',

  /**
   * System is unhealthy
   * @description One or more checks failed
   */
  FAIL = 'fail',
}

