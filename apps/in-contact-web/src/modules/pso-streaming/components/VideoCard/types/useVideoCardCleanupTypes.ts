/**
 * @fileoverview useVideoCardCleanup hook types
 * @summary Type definitions for useVideoCardCleanup hook
 * @description Type definitions for useVideoCardCleanup hook options
 */

import type { Room } from 'livekit-client';

/**
 * Options for useVideoCardCleanup hook
 */
export interface IUseVideoCardCleanupOptions {
  roomRef: React.RefObject<Room | null>;
  roomName: string | null | undefined;
  email: string;
  hasActiveSessionRef: React.MutableRefObject<boolean>;
  activeSessionIdRef: React.MutableRefObject<string | null>;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  shouldStream: boolean;
  isRecording: boolean;
  isTalking: boolean;
  stopRecordingIfActive: () => Promise<void>;
  stopTalk: () => Promise<void>;
}

