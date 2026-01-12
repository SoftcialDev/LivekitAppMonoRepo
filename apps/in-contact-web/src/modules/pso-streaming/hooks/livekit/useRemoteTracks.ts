/**
 * @fileoverview useRemoteTracks hook
 * @summary Hook for managing remote participant tracks
 * @description Orchestrates track attachment, subscriptions, and participant setup.
 * Uses smaller hooks following SRP to reduce complexity.
 */

import { useRef, useCallback, useEffect } from 'react';
import type { Room, RemoteParticipant } from 'livekit-client';
import { logDebug, logWarn } from '@/shared/utils/logger';
import { useTrackAttachment } from './hooks/useTrackAttachment';
import { useTrackSubscriptions } from './hooks/useTrackSubscriptions';
import { useParticipantSetup } from './hooks/useParticipantSetup';
import { useRoomEventListeners } from './hooks/useRoomEventListeners';
import { MAX_ROOM_CHECK_COUNT, ROOM_CHECK_INTERVAL_MS } from './constants/remoteTracksConstants';
import type { IUseRemoteTracksOptions, IUseRemoteTracksReturn } from './types/remoteTracksTypes';

/**
 * Hook for managing remote participant tracks
 * 
 * @param options - Configuration options
 * @returns Object containing track management functions
 */
export function useRemoteTracks(options: IUseRemoteTracksOptions): IUseRemoteTracksReturn {
  const { roomRef, targetIdentity, videoRef, audioRef, audioAttachment, isConnected } = options;

  // Track room instance changes
  const prevRoomRef = useRef<Room | null>(null);
  const roomInstanceIdRef = useRef<number>(0);
  const hasCleanedUpRef = useRef<boolean>(false); // Track if cleanup has been called to avoid repeated cleanups

  // Track attachment hook
  const trackAttachment = useTrackAttachment({
    videoRef,
    audioRef,
    audioAttachment,
  });

  // Handle track ready (subscribed and ready to attach)
  const handleTrackReady = useCallback(
    (publication: any): void => {
      if (trackAttachment.isTrackAttached(publication.trackSid)) {
        return;
      }

      trackAttachment.attachTrack(publication);
    },
    [trackAttachment]
  );

  // Track subscriptions hook
  const trackSubscriptions = useTrackSubscriptions({
    roomRef,
    targetIdentity,
    onTrackReady: handleTrackReady,
  });

  // Participant setup hook
  const participantSetup = useParticipantSetup({
    targetIdentity,
    onTrackReady: handleTrackReady,
  });

  // Handle track unpublished with smooth transition
  const handleTrackUnpublished = useCallback(
    (publication: any, participant: RemoteParticipant): void => {
      const trackSid = publication.trackSid;
      if (!trackSid || !trackAttachment.isTrackAttached(trackSid)) {
        return;
      }

      logDebug('[useRemoteTracks] Track unpublished, scheduling delayed detach', {
        trackSid,
        kind: publication.kind,
        isCurrentVideoTrack: trackAttachment.getCurrentVideoTrackSid() === trackSid,
      });

      trackAttachment.markTrackDetached(trackSid);

      // For video tracks, implement smooth transition
      if (publication.kind === 'video' && publication.track) {
        const isCurrentTrack = trackAttachment.getCurrentVideoTrackSid() === trackSid;

        if (isCurrentTrack) {
          trackAttachment.setCurrentVideoTrackSid(null);
          trackAttachment.scheduleDelayedDetach(trackSid, publication.track, 300);
        }
      }
    },
    [trackAttachment]
  );

  // Handle participant connected
  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant): void => {
      logDebug('[useRemoteTracks] New participant connected', { identity: participant.identity });
      trackAttachment.cleanup();
      participantSetup.clearAllSetups();
      participantSetup.setupParticipant(participant);
      trackSubscriptions.setupTrackSubscriptions(participant);
    },
    [trackAttachment, participantSetup, trackSubscriptions]
  );

  // Room event listeners hook
  const roomEventListeners = useRoomEventListeners({
    targetIdentity,
    onTrackPublished: trackSubscriptions.handleTrackPublished,
    onTrackUnpublished: handleTrackUnpublished,
    onParticipantConnected: handleParticipantConnected,
  });

  // Cleanup function
  const cleanup = useCallback((): void => {
    // Only log if not already cleaned up (when targetIdentity is null)
    if (targetIdentity === null && hasCleanedUpRef.current) {
      return; // Already cleaned up, skip
    }

    logDebug('[useRemoteTracks] Cleaning up tracks and handlers', {
      targetIdentity,
    });

    const room = roomRef.current;
    roomEventListeners.cleanup(room);
    trackSubscriptions.cleanup();
    trackAttachment.cleanup();
    participantSetup.clearAllSetups();
  }, [roomRef, targetIdentity, roomEventListeners, trackSubscriptions, trackAttachment, participantSetup]);

  // Handler for reconnection check after room change
  const handleReconnectionCheck = useCallback((): void => {
    const room = roomRef.current;
    if (room?.state !== 'connected') return;

    const participant = Array.from(room.remoteParticipants.values()).find(
      (p) => p.identity === targetIdentity
    );

    if (participant) {
      for (const pub of participant.getTrackPublications().values()) {
        if (pub.isSubscribed && pub.track && pub.trackSid) {
          if (!trackAttachment.isTrackAttached(pub.trackSid)) {
            logDebug('[useRemoteTracks] Found unattached track after reconnection', {
              trackSid: pub.trackSid,
              kind: pub.kind,
            });
            handleTrackReady(pub);
          }
        }
      }
    }
  }, [roomRef, targetIdentity, trackAttachment, handleTrackReady]);

  // Handler for fallback track check
  const handleFallbackCheck = useCallback((): void => {
    const room = roomRef.current;
    if (room?.state === 'connected') {
      const participant = Array.from(room.remoteParticipants.values()).find(
        (p) => p.identity === targetIdentity
      );

      if (participant) {
        const hasAttachedTracks = Array.from(participant.getTrackPublications().values()).some(
          (pub) => pub.isSubscribed && pub.track && pub.trackSid && trackAttachment.isTrackAttached(pub.trackSid)
        );

        if (!hasAttachedTracks) {
          logDebug('[useRemoteTracks] Fallback: No tracks attached, re-checking', {
            identity: participant.identity,
          });
          participantSetup.setupParticipant(participant);
        }
      }
    }
  }, [roomRef, targetIdentity, trackAttachment, participantSetup]);

  // Main effect: setup room listeners and existing participants
  useEffect(() => {
    if (!targetIdentity) {
      // Only cleanup if not already cleaned up (avoid repeated cleanups and logs)
      if (!hasCleanedUpRef.current) {
        cleanup();
        hasCleanedUpRef.current = true;
      }
      prevRoomRef.current = null;
      return;
    }

    // Reset cleanup flag when targetIdentity is set (new connection)
    hasCleanedUpRef.current = false;

    if (isConnected === false) {
      logDebug('[useRemoteTracks] Room not connected yet, waiting...', { targetIdentity, isConnected });
      return;
    }

    const currentRoom = roomRef.current;
    const roomChanged = prevRoomRef.current !== currentRoom;

    if (roomChanged && currentRoom) {
      roomInstanceIdRef.current += 1;
      logDebug('[useRemoteTracks] Room instance changed, resetting tracking', {
        targetIdentity,
        roomInstanceId: roomInstanceIdRef.current,
      });

      trackAttachment.cleanup();
      participantSetup.clearAllSetups();
      trackSubscriptions.cleanup();
      prevRoomRef.current = currentRoom;
    } else if (!roomChanged && targetIdentity) {
      trackAttachment.cleanup();
      participantSetup.clearAllSetups();
    }

    let intervalId: NodeJS.Timeout | null = null;
    let fallbackTimeoutId: NodeJS.Timeout | null = null;
    let checkReconnectionTimeoutId: NodeJS.Timeout | null = null;

    const setupRoomListeners = (): boolean => {
      const room = roomRef.current;
      if (room?.state !== 'connected') {
        return false;
      }

      roomEventListeners.setupListeners(room);

      // Setup existing participants
      room.remoteParticipants.forEach((p) => {
        if (p.identity === targetIdentity && !participantSetup.isParticipantSetup(p.identity)) {
          logDebug('[useRemoteTracks] Setting up existing participant', {
            identity: p.identity,
            trackCount: p.trackPublications.size,
          });
          participantSetup.setupParticipant(p);
          trackSubscriptions.setupTrackSubscriptions(p);
        }
      });

      // Verify and attach existing tracks after reconnection
      if (roomChanged && currentRoom) {
        if (checkReconnectionTimeoutId) {
          clearTimeout(checkReconnectionTimeoutId);
        }

        checkReconnectionTimeoutId = setTimeout(() => {
          checkReconnectionTimeoutId = null;
          handleReconnectionCheck();
        }, 500);
      }

      // Fallback timeout: re-check tracks after 2000ms if no tracks attached
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId);
      }

      fallbackTimeoutId = setTimeout(() => {
        handleFallbackCheck();
      }, 2000);

      return true;
    };

    // Poll until room is connected and listeners are set up
    let checkCount = 0;
    intervalId = setInterval(() => {
      checkCount++;

      if (setupRoomListeners()) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else if (checkCount >= MAX_ROOM_CHECK_COUNT) {
        logWarn('[useRemoteTracks] Room not available after polling', {
          targetIdentity,
          checkCount,
          isConnected,
        });
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }, ROOM_CHECK_INTERVAL_MS);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId);
      }
      if (checkReconnectionTimeoutId) {
        clearTimeout(checkReconnectionTimeoutId);
      }
    };
  }, [targetIdentity, isConnected, roomRef, trackAttachment, participantSetup, trackSubscriptions, roomEventListeners, handleTrackReady, handleReconnectionCheck, handleFallbackCheck, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    setupParticipant: participantSetup.setupParticipant,
    cleanup,
  };
}
