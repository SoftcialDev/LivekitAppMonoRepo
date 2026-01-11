/**
 * @fileoverview MediaPermissionError - Error class for media permission errors
 * @summary Error class for camera/microphone permission denials
 * @description Custom error class that includes device information for permission errors
 */

import { AppError } from './AppError';

/**
 * Error class for media permission errors
 * 
 * Includes information about available cameras and microphones
 * to help users understand which devices are available
 */
export class MediaPermissionError extends AppError {
  /**
   * List of available camera devices
   */
  public readonly cameras: MediaDeviceInfo[];

  /**
   * List of available microphone devices
   */
  public readonly microphones: MediaDeviceInfo[];

  /**
   * Whether camera permission is blocked
   */
  public readonly cameraBlocked: boolean;

  /**
   * Whether microphone permission is blocked
   */
  public readonly microphoneBlocked: boolean;

  /**
   * Creates a new MediaPermissionError
   * 
   * @param message - Error message
   * @param cameras - List of available camera devices
   * @param microphones - List of available microphone devices
   * @param cameraBlocked - Whether camera permission is blocked
   * @param microphoneBlocked - Whether microphone permission is blocked
   */
  constructor(
    message: string,
    cameras: MediaDeviceInfo[] = [],
    microphones: MediaDeviceInfo[] = [],
    cameraBlocked: boolean = false,
    microphoneBlocked: boolean = false
  ) {
    super(message);
    this.name = 'MediaPermissionError';
    this.cameras = cameras;
    this.microphones = microphones;
    this.cameraBlocked = cameraBlocked;
    this.microphoneBlocked = microphoneBlocked;
  }
}

