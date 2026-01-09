/**
 * @fileoverview useRemoteTracks - Hook for managing remote participant tracks
 * @summary Handles attachment and detachment of remote video/audio tracks
 * @description Manages subscription to remote participant tracks, handles track
 * publication events, and coordinates with audio attachment logic.
 */

import { useRef, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from 'livekit-client';
import { UseAudioAttachment } from './useAudioAttachment';

export interface UseRemoteTracksOptions {
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
  audioAttachment: UseAudioAttachment;
}

export interface UseRemoteTracks {
  /**
   * Sets up a participant to handle their tracks
   */
  setupParticipant: (participant: RemoteParticipant) => void;
  /**
   * Cleans up all track handlers
   */
  cleanup: () => void;
}

/**
 * Hook for managing remote participant tracks
 * @param options - Configuration options
 * @returns Object containing track management functions
 */
export function useRemoteTracks(options: UseRemoteTracksOptions): UseRemoteTracks {
  const { roomRef, targetIdentity, videoRef, audioRef, audioAttachment } = options;

  const participantTrackHandlersRef = useRef(
    new Map<RemoteParticipant, (pub: any) => void>()
  );
  const audioPollIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const onParticipantConnectedHandlerRef = useRef<((p: RemoteParticipant) => void) | null>(null);
  const trackPublishedHandlerRef = useRef<((publication: any, participant: RemoteParticipant) => void) | null>(null);

  /**
   * Attaches a track to the appropriate element
   */
  const attachTrack = useCallback(
    (pub: any) => {
      const { track, kind, isSubscribed } = pub;
      if (!isSubscribed || !track) {
        console.log('[useRemoteTracks] Track not ready:', {
          kind,
          isSubscribed,
          hasTrack: !!track,
        });
        return;
      }

      if (kind === 'video') {
        if (videoRef.current) {
          (track as RemoteVideoTrack).attach(videoRef.current);
        }
      } else if (kind === 'audio') {
        // Audio attachment is handled by useAudioAttachment hook
        // which will check conditions and attach if appropriate
        audioAttachment.attachAudioTrack(track as RemoteAudioTrack);
      }
    },
    [videoRef, audioRef, audioAttachment, roomRef, targetIdentity]
  );

  /**
   * Sets up a participant to handle their tracks
   */
  const setupParticipant = useCallback(
    (participant: RemoteParticipant) => {
      // Attach existing subscribed tracks
      for (const pub of participant.getTrackPublications().values()) {
        attachTrack(pub);
      }

      // Subscribe handler for new tracks
      const handleTrackSubscribed = (pub: any) => {
        attachTrack(pub);
      };

      participantTrackHandlersRef.current.set(participant, handleTrackSubscribed);
      participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
    },
    [attachTrack]
  );

  /**
   * Handles track published events
   */
  const handleTrackPublished = useCallback(
    (publication: any, participant: RemoteParticipant) => {
      if (participant.identity !== targetIdentity) {
        return;
      }

      console.log('[useRemoteTracks] Track published:', {
        kind: publication.kind,
        isSubscribed: publication.isSubscribed,
        trackSid: publication.trackSid,
      });

      // Setup participant to handle the track when it gets subscribed
      setupParticipant(participant);

      // If track is already subscribed, attach it immediately
      if (publication.isSubscribed && publication.track) {
        attachTrack(publication);
      } else if (publication.kind === 'audio') {
        // For audio tracks that aren't subscribed yet, set up polling
        // Only poll if admin has an active talk session
        const room = roomRef.current;
        if (!room) return;

        // Check if we should poll (this will be determined by audio attachment logic)
        let checkCount = 0;
        const maxChecks = 20; // Check for up to 10 seconds (20 * 500ms)
        const checkInterval = setInterval(() => {
          checkCount++;
          const currentPub = participant.getTrackPublication(publication.trackSid);
          if (currentPub && currentPub.isSubscribed && currentPub.track) {
            console.log(
              '[useRemoteTracks] Audio track became subscribed after polling, attaching now'
            );
            clearInterval(checkInterval);
            audioPollIntervalsRef.current.delete(checkInterval);
            attachTrack(currentPub);
          } else if (checkCount >= maxChecks) {
            console.warn('[useRemoteTracks] Audio track did not become subscribed after polling');
            clearInterval(checkInterval);
            audioPollIntervalsRef.current.delete(checkInterval);
          }
        }, 500);

        audioPollIntervalsRef.current.add(checkInterval);
      }
    },
    [targetIdentity, setupParticipant, attachTrack, roomRef]
  );

  /**
   * Cleans up all track handlers and intervals
   */
  const cleanup = useCallback(() => {
    const room = roomRef.current;
    if (room) {
      room.off(RoomEvent.TrackPublished, handleTrackPublished);
    }

    participantTrackHandlersRef.current.forEach((handler, participant) => {
      participant.off(ParticipantEvent.TrackSubscribed, handler);
    });
    participantTrackHandlersRef.current.clear();

    audioPollIntervalsRef.current.forEach((interval) => {
      clearInterval(interval);
    });
    audioPollIntervalsRef.current.clear();
  }, [roomRef, handleTrackPublished]);

  /**
   * Set up room event listeners when room is available
   * Use a polling mechanism to detect when roomRef.current becomes available
   */
  useEffect(() => {
    if (!targetIdentity) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const setupRoomListeners = () => {
      const room = roomRef.current;
      if (!room) {
        return false;
      }

      // Room is available, set up listeners
      console.log('[useRemoteTracks] Setting up room listeners for', targetIdentity);
      
      // Store handlers for cleanup
      trackPublishedHandlerRef.current = handleTrackPublished;
      onParticipantConnectedHandlerRef.current = (p: RemoteParticipant) => {
        if (p.identity === targetIdentity) {
          console.log('[useRemoteTracks] New participant connected:', p.identity);
          setupParticipant(p);
        }
      };

      room.on(RoomEvent.TrackPublished, handleTrackPublished);

      // Setup existing participants
      room.remoteParticipants.forEach((p) => {
        if (p.identity === targetIdentity) {
          console.log('[useRemoteTracks] Setting up existing participant:', p.identity);
          setupParticipant(p);
        }
      });

      // Setup new participants
      if (onParticipantConnectedHandlerRef.current) {
        room.on(RoomEvent.ParticipantConnected, onParticipantConnectedHandlerRef.current);
      }

      // Clean up interval if room was found
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      return true;
    };

    // Try to set up immediately
    if (setupRoomListeners()) {
      // Room is already available, set up cleanup
      return () => {
        const room = roomRef.current;
        if (room) {
          cleanup();
          room.off(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
            if (p.identity === targetIdentity) {
              setupParticipant(p);
            }
          });
        }
      };
    }

    // Room not available yet, poll for it
    let checkCount = 0;
    const maxChecks = 40; // Check for up to 20 seconds (40 * 500ms)
    
    intervalId = setInterval(() => {
      checkCount++;
      if (setupRoomListeners()) {
        // Room found, cleanup will be handled by the return function below
        return;
      }
      
      if (checkCount >= maxChecks) {
        console.warn('[useRemoteTracks] Room not available after polling');
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }, 500);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      cleanup();
      const room = roomRef.current;
      if (room) {
        if (trackPublishedHandlerRef.current) {
          room.off(RoomEvent.TrackPublished, trackPublishedHandlerRef.current);
        }
        if (onParticipantConnectedHandlerRef.current) {
          room.off(RoomEvent.ParticipantConnected, onParticipantConnectedHandlerRef.current);
        }
      }
    };
  }, [targetIdentity, setupParticipant, handleTrackPublished, cleanup, roomRef]);

  return {
    setupParticipant,
    cleanup,
  };
}

