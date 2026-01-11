/**
 * @fileoverview useRecording hook types
 * @summary Type definitions for useRecording hook
 * @description Types for LiveKit recording operations
 */

/**
 * Return type of the useRecording hook
 */
export interface IUseRecordingReturn {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Whether a recording operation is in progress */
  loading: boolean;
  /** Toggles recording state (start if not recording, stop if recording) */
  toggleRecording: () => Promise<void>;
  /** Stops recording if currently active */
  stopRecordingIfActive: () => Promise<void>;
}

