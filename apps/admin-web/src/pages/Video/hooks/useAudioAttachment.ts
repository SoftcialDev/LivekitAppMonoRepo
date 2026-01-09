/**
 * @fileoverview useAudioAttachment - Hook for conditionally attaching audio tracks
 * @summary Manages audio track attachment logic based on talk session state
 * @description Provides logic to determine when audio tracks should be attached and played,
 * considering talk session state, active session ownership, and audio mute state.
 * Re-evaluates existing tracks when isTalking changes to handle cases where tracks
 * were published before the talk session started.
 */

import { useRef, useEffect, useCallback } from 'react';
import { RemoteAudioTrack, RemoteParticipant } from 'livekit-client';
import { useAudioPlay } from './useAudioPlay';

export interface UseAudioAttachmentOptions {
  /**
   * Reference to the HTML audio element
   */
  audioRef: React.RefObject<HTMLAudioElement>;
  /**
   * Whether the admin has started a talk session
   */
  isTalking: boolean;
  /**
   * Whether there's an active talk session for the PSO
   */
  hasActiveSession: boolean;
  /**
   * Email of the supervisor in the active session (if any)
   */
  activeSupervisorEmail: string | null;
  /**
   * Email of the current admin
   */
  currentAdminEmail: string | null;
  /**
   * Whether audio is muted
   */
  isAudioMuted: boolean;
  /**
   * Reference to the LiveKit room
   */
  roomRef: React.RefObject<any>;
  /**
   * Identity of the remote participant (PSO)
   */
  roomName: string | null;
}

export interface UseAudioAttachment {
  /**
   * Determines if audio should be attached based on current state
   */
  shouldAttachAudio: (
    hasActiveSession: boolean,
    activeSupervisorEmail: string | null,
    currentAdminEmail: string | null,
    isTalking: boolean
  ) => boolean;
  /**
   * Attaches and plays an audio track
   */
  attachAudioTrack: (track: RemoteAudioTrack) => void;
  /**
   * Re-evaluates and attaches existing audio tracks when isTalking changes
   */
  reEvaluateAudioTracks: () => void;
}

/**
 * Hook for managing audio track attachment logic
 * @param options - Configuration options
 * @returns Object containing audio attachment functions
 */
export function useAudioAttachment(
  options: UseAudioAttachmentOptions
): UseAudioAttachment {
  const {
    audioRef,
    isTalking,
    hasActiveSession,
    activeSupervisorEmail,
    currentAdminEmail,
    isAudioMuted,
    roomRef,
    roomName,
  } = options;

  const { playAudio: playAudioSafely } = useAudioPlay({ maxRetries: 2, retryDelay: 300 });

  /**
   * Determines if audio should be attached based on current state
   */
  const shouldAttachAudio = useCallback((
    currentHasActiveSession: boolean,
    currentActiveSupervisorEmail: string | null,
    currentAdminEmail: string | null,
    currentIsTalking: boolean
  ): boolean => {
    const isMySession =
      !currentHasActiveSession ||
      (currentActiveSupervisorEmail &&
        currentAdminEmail &&
        currentActiveSupervisorEmail.toLowerCase() === currentAdminEmail.toLowerCase());
    return Boolean(currentIsTalking && isMySession);
  }, []);

  /**
   * Attaches and plays an audio track
   * Checks conditions before attaching
   */
  const attachAudioTrack = useCallback(
    (track: RemoteAudioTrack) => {
      if (!audioRef.current) {
        console.warn('[useAudioAttachment] Audio ref not available');
        return;
      }

      // Check if we should attach based on current state
      const canHearAudio = shouldAttachAudio(
        hasActiveSession,
        activeSupervisorEmail,
        currentAdminEmail,
        isTalking
      );

      if (!canHearAudio) {
        console.log('[useAudioAttachment] Not attaching audio - conditions not met', {
          isTalking,
          hasActiveSession,
          activeSupervisorEmail,
          currentAdminEmail,
        });
        return;
      }

      track.attach(audioRef.current);
      audioRef.current.muted = isAudioMuted;
      audioRef.current.volume = 1.0;

      playAudioSafely(audioRef.current).catch((err) => {
        // Error already logged in useAudioPlay
        // NotAllowedError means user interaction is required
      });
    },
    [
      audioRef,
      isAudioMuted,
      playAudioSafely,
      shouldAttachAudio,
      hasActiveSession,
      activeSupervisorEmail,
      currentAdminEmail,
      isTalking,
    ]
  );

  /**
   * Re-evaluates existing audio tracks when isTalking changes
   * This handles the case where tracks were published before talk session started
   */
  const reEvaluateAudioTracks = useCallback(() => {
    const room = roomRef.current;
    if (!room || !roomName) {
      return;
    }

    // Find participant by identity (roomName is the PSO's identity)
    let participant: RemoteParticipant | undefined;
    for (const p of room.remoteParticipants.values()) {
      if (p.identity === roomName) {
        participant = p;
        break;
      }
    }

    if (!participant) {
      return;
    }

    const canHearAudio = shouldAttachAudio(
      hasActiveSession,
      activeSupervisorEmail,
      currentAdminEmail,
      isTalking
    );

    if (!canHearAudio) {
      console.log('[useAudioAttachment] Not re-attaching audio - conditions not met', {
        isTalking,
        hasActiveSession,
        activeSupervisorEmail,
        currentAdminEmail,
      });
      return;
    }

    // Find all audio tracks for this participant
    const audioPublications = Array.from(participant.getTrackPublications().values()).filter(
      (pub: any) => pub.kind === 'audio' && pub.isSubscribed && pub.audioTrack
    );

    for (const pub of audioPublications) {
      if (pub.audioTrack) {
        // Check if track is already attached to our audio element
        // We check by seeing if the track's element matches our audioRef
        const trackElement = (pub.audioTrack as any).element;
        const isAttached = audioRef.current && trackElement === audioRef.current;
        if (!isAttached) {
          console.log('[useAudioAttachment] Re-attaching audio track after isTalking changed');
          attachAudioTrack(pub.audioTrack as RemoteAudioTrack);
        }
      }
    }
  }, [
    roomRef,
    roomName,
    isTalking,
    hasActiveSession,
    activeSupervisorEmail,
    currentAdminEmail,
    shouldAttachAudio,
    attachAudioTrack,
    audioRef,
  ]);

  /**
   * Re-evaluate audio tracks when isTalking changes
   */
  useEffect(() => {
    if (isTalking) {
      // Small delay to ensure state is updated
      const timeoutId = setTimeout(() => {
        reEvaluateAudioTracks();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isTalking, reEvaluateAudioTracks]);

  return {
    shouldAttachAudio,
    attachAudioTrack,
    reEvaluateAudioTracks,
  };
}

