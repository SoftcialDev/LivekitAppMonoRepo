/**
 * @fileoverview Types for useStreamingDashboard hook
 * @summary Type definitions for streaming dashboard orchestrator hook
 */

import type { Room, LocalVideoTrack } from 'livekit-client';

/**
 * Return type for useStreamingDashboard hook
 */
export interface IUseStreamingDashboardReturn {
  /**
   * Reference to video element
   */
  videoRef: React.RefObject<HTMLVideoElement>;

  /**
   * Reference to audio element
   */
  audioRef: React.RefObject<HTMLAudioElement>;

  /**
   * Whether streaming is currently active
   */
  isStreaming: boolean;

  /**
   * Current video track (if any)
   */
  videoTrack: LocalVideoTrack | null;

  /**
   * Gets the current LiveKit room instance
   */
  getCurrentRoom: () => Room | null;

  /**
   * Starts streaming session
   */
  startStream: () => Promise<void>;

  /**
   * Stops streaming session
   * @param reason - Optional stop reason (e.g., 'EMERGENCY', 'QUICK_BREAK', etc.)
   */
  stopStream: (reason?: string) => Promise<void>;
}

