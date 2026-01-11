/**
 * @fileoverview Room event listeners types
 * @summary Type definitions for room event listeners hook
 * @description Types for managing room event listeners
 */

import type { Room, RemoteParticipant } from 'livekit-client';

/**
 * Options for useRoomEventListeners hook
 */
export interface IUseRoomEventListenersOptions {
  targetIdentity: string | null;
  onTrackPublished: (publication: any, participant: RemoteParticipant) => void;
  onTrackUnpublished: (publication: any, participant: RemoteParticipant) => void;
  onParticipantConnected: (participant: RemoteParticipant) => void;
}

/**
 * Return type for useRoomEventListeners hook
 */
export interface IUseRoomEventListenersReturn {
  setupListeners: (room: Room) => void;
  cleanup: (room: Room | null) => void;
}

