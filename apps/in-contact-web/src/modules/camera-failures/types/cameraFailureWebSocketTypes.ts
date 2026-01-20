/**
 * @fileoverview Camera Failure WebSocket Message Types
 * @summary Type definitions for camera failure WebSocket messages
 * @description Types for real-time camera failure notifications via WebSocket
 */

/**
 * WebSocket message for camera failure notifications
 * 
 * Sent to the command initiator when a PSO reports a camera start failure.
 */
export interface CameraFailureMessage {
  /**
   * Message type identifier
   */
  type: 'cameraFailure';

  /**
   * Email of the PSO who reported the failure
   */
  psoEmail: string;

  /**
   * Full name of the PSO who reported the failure
   */
  psoName: string;

  /**
   * Failure stage where the error occurred
   */
  stage: string;

  /**
   * User-friendly error message
   */
  errorMessage: string;

  /**
   * ISO timestamp when the failure occurred
   */
  timestamp: string;
}

