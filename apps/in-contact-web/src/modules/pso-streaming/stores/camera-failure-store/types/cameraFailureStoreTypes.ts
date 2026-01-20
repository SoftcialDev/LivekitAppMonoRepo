/**
 * @fileoverview Camera Failure Store Types
 * @summary Type definitions for camera failure store
 * @description Types for storing camera failure errors by PSO email
 */

/**
 * State interface for camera failure store
 */
export interface ICameraFailureStoreState {
  /**
   * Map of PSO email to error message
   */
  errors: Map<string, string>;

  /**
   * Sets an error message for a PSO
   * @param psoEmail - Email of the PSO
   * @param errorMessage - Error message to display
   */
  setError: (psoEmail: string, errorMessage: string) => void;

  /**
   * Clears the error message for a PSO
   * @param psoEmail - Email of the PSO
   */
  clearError: (psoEmail: string) => void;

  /**
   * Gets the error message for a PSO
   * @param psoEmail - Email of the PSO
   * @returns Error message or undefined if no error
   */
  getError: (psoEmail: string) => string | undefined;
}

