/**
 * @fileoverview MediaPermissionsModal types
 * @summary Type definitions for MediaPermissionsModal component
 */

export interface IMediaPermissionsModalProps {
  /**
   * Whether the modal is visible
   */
  open: boolean;

  /**
   * Callback invoked when the modal is closed
   */
  onClose: () => void;

  /**
   * List of available camera devices
   */
  cameras: MediaDeviceInfo[];

  /**
   * List of available microphone devices
   */
  microphones: MediaDeviceInfo[];

  /**
   * Whether camera permission is blocked
   */
  cameraBlocked: boolean;

  /**
   * Whether microphone permission is blocked
   */
  microphoneBlocked: boolean;
}

