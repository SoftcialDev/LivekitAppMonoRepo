/**
 * @fileoverview useRoomEventListeners hook
 * @summary Hook for managing room event listeners
 * @description Handles registration and cleanup of room event listeners
 */

import { useRef, useCallback } from 'react';
import type { Room, RemoteParticipant } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { logDebug } from '@/shared/utils/logger';
import type {
  IUseRoomEventListenersOptions,
  IUseRoomEventListenersReturn,
} from '../types/roomEventListenersTypes';

/**
 * Hook for managing room event listeners
 * @param options - Configuration options
 * @returns Listener management functions
 */
export function useRoomEventListeners(
  options: IUseRoomEventListenersOptions
): IUseRoomEventListenersReturn {
  const { targetIdentity, onTrackPublished, onTrackUnpublished, onParticipantConnected } = options;

  const trackPublishedHandlerRef = useRef<((publication: any, participant: RemoteParticipant) => void) | null>(null);
  const trackUnpublishedHandlerRef = useRef<((publication: any, participant: RemoteParticipant) => void) | null>(null);
  const participantConnectedHandlerRef = useRef<((participant: RemoteParticipant) => void) | null>(null);

  const setupListeners = useCallback(
    (room: Room): void => {
      if (room.state !== 'connected') {
        return;
      }

      logDebug('[useRoomEventListeners] Setting up room listeners', { targetIdentity });

      // TrackPublished handler (one-time registration)
      if (!trackPublishedHandlerRef.current) {
        trackPublishedHandlerRef.current = onTrackPublished;
        room.on(RoomEvent.TrackPublished, trackPublishedHandlerRef.current);
      }

      // TrackUnpublished handler (one-time registration)
      if (!trackUnpublishedHandlerRef.current) {
        trackUnpublishedHandlerRef.current = (publication: any, participant: RemoteParticipant): void => {
          if (participant.identity !== targetIdentity) {
            return;
          }
          onTrackUnpublished(publication, participant);
        };
        room.on(RoomEvent.TrackUnpublished, trackUnpublishedHandlerRef.current);
      }

      // ParticipantConnected handler (one-time registration)
      if (!participantConnectedHandlerRef.current) {
        participantConnectedHandlerRef.current = (participant: RemoteParticipant): void => {
          if (participant.identity === targetIdentity) {
            onParticipantConnected(participant);
          }
        };
        room.on(RoomEvent.ParticipantConnected, participantConnectedHandlerRef.current);
      }
    },
    [targetIdentity, onTrackPublished, onTrackUnpublished, onParticipantConnected]
  );

  const cleanup = useCallback(
    (room: Room | null): void => {
      if (!room) {
        return;
      }

      if (trackPublishedHandlerRef.current) {
        room.off(RoomEvent.TrackPublished, trackPublishedHandlerRef.current);
        trackPublishedHandlerRef.current = null;
      }

      if (trackUnpublishedHandlerRef.current) {
        room.off(RoomEvent.TrackUnpublished, trackUnpublishedHandlerRef.current);
        trackUnpublishedHandlerRef.current = null;
      }

      if (participantConnectedHandlerRef.current) {
        room.off(RoomEvent.ParticipantConnected, participantConnectedHandlerRef.current);
        participantConnectedHandlerRef.current = null;
      }
    },
    []
  );

  return {
    setupListeners,
    cleanup,
  };
}

