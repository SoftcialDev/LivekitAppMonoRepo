/**
 * @fileoverview Remote tracks types
 * @summary Type definitions for remote tracks hook
 * @description Types for managing remote participant tracks
 */

import type { Room, RemoteParticipant } from 'livekit-client';
import type { IUseAudioAttachmentReturn } from '../../audio/types/audioAttachmentTypes';

/**
 * Options for useRemoteTracks hook
 */
export interface IUseRemoteTracksOptions {
  /**
   * Reference to the LiveKit room
   */
  roomRef: React.RefObject<Room | null>;
  /**
   * Identity of the remote participant to watch
   */
  targetIdentity: string | null;
  /**
   * Reference to the video element
   */
  videoRef: React.RefObject<HTMLVideoElement>;
  /**
   * Reference to the audio element
   */
  audioRef: React.RefObject<HTMLAudioElement>;
  /**
   * Audio attachment hook instance
   */
  audioAttachment: IUseAudioAttachmentReturn;
  /**
   * Whether the room is currently connected.
   * If provided, tracks setup will only happen when isConnected is true.
   * If undefined, the hook will use polling to detect room connection.
   */
  isConnected?: boolean;
}

/**
 * Return type for useRemoteTracks hook
 */
export interface IUseRemoteTracksReturn {
  /**
   * Sets up a participant to handle their tracks
   */
  setupParticipant: (participant: RemoteParticipant) => void;
  /**
   * Cleans up all track handlers
   */
  cleanup: () => void;
}

