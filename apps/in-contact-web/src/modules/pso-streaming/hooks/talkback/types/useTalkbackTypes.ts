/**
 * @fileoverview useTalkback hook types
 * @summary Type definitions for useTalkback hook
 * @description Types for push-to-talk functionality
 */

import type { MutableRefObject } from 'react';
import type { Room } from 'livekit-client';

/**
 * Options for useTalkback hook
 */
export interface IUseTalkbackOptions {
  /**
   * Reference to the current LiveKit Room
   * The hook publishes/unpublishes the local mic track to this room
   */
  roomRef: MutableRefObject<Room | null>;

  /**
   * Optional identity of the intended recipient (remote participant)
   * Not required for publishing (server forwards to the room), but useful for logging or future routing
   */
  targetIdentity?: string;

  /**
   * Email of the PSO to start a talk session with
   * If provided, the hook will call TalkSessionStart/Stop APIs
   */
  psoEmail?: string;

  /**
   * Whether to stop the underlying MediaStreamTrack when unpublishing
   * Defaults to true
   */
  stopOnUnpublish?: boolean;
}

/**
 * Return type of useTalkback hook
 */
export interface IUseTalkbackReturn {
  /** true while the local microphone is currently published to the room */
  isTalking: boolean;
  /** true while starting/stopping the talkback flow */
  loading: boolean;
  /** Current countdown value (3, 2, 1, or null) */
  countdown: number | null;
  /** true if countdown is active */
  isCountdownActive: boolean;
  /** Starts publishing the local microphone to the LiveKit room */
  start: () => Promise<void>;
  /** Stops publishing the local microphone to the LiveKit room */
  stop: () => Promise<void>;
  /** Cancels an active countdown */
  cancel: () => void;
}

