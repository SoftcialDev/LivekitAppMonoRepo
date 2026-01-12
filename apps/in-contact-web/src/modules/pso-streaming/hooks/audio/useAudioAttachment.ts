/**
 * @fileoverview useAudioAttachment hook
 * @summary Hook for conditionally attaching audio tracks
 * @description Manages audio track attachment logic based on talk session state.
 * Provides logic to determine when audio tracks should be attached and played,
 * considering talk session state, active session ownership, and audio mute state.
 * Re-evaluates existing tracks when isTalking changes to handle cases where tracks
 * were published before the talk session started.
 */

import { useEffect, useCallback } from 'react';
import type { RemoteAudioTrack, RemoteParticipant } from 'livekit-client';
import { logWarn, logDebug } from '@/shared/utils/logger';
import { useAudioPlay } from './useAudioPlay';
import type {
  IUseAudioAttachmentOptions,
  IUseAudioAttachmentReturn,
} from './types/audioAttachmentTypes';

/**
 * Hook for managing audio track attachment logic
 * 
 * @param options - Configuration options
 * @returns Object containing audio attachment functions
 */
export function useAudioAttachment(
  options: IUseAudioAttachmentOptions
): IUseAudioAttachmentReturn {
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
  const shouldAttachAudio = useCallback(
    (
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
    },
    []
  );

  /**
   * Attaches and plays an audio track
   */
  const attachAudioTrack = useCallback(
    (track: RemoteAudioTrack): void => {
      if (!audioRef.current) {
        logWarn('[useAudioAttachment] Audio ref not available');
        return;
      }

      const canHearAudio = shouldAttachAudio(
        hasActiveSession,
        activeSupervisorEmail,
        currentAdminEmail,
        isTalking
      );

      if (!canHearAudio) {
        logDebug('[useAudioAttachment] Not attaching audio - conditions not met', {
          isTalking,
          hasActiveSession,
          activeSupervisorEmail,
          currentAdminEmail,
        });
        return;
      }

      track.attach(audioRef.current);
      audioRef.current.muted = isAudioMuted;
      audioRef.current.volume = 1;

      playAudioSafely(audioRef.current).catch(() => {
        // Error already logged in useAudioPlay
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
   */
  const reEvaluateAudioTracks = useCallback((): void => {
    const room = roomRef.current;
    if (!room || !roomName) {
      return;
    }

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
      logDebug('[useAudioAttachment] Not re-attaching audio - conditions not met', {
        isTalking,
        hasActiveSession,
        activeSupervisorEmail,
        currentAdminEmail,
      });
      return;
    }

    const audioPublications = Array.from(participant.getTrackPublications().values()).filter(
      (pub: any) => pub.kind === 'audio' && pub.isSubscribed && pub.audioTrack
    );

    for (const pub of audioPublications) {
      if (pub.audioTrack) {
        const trackElement = (pub.audioTrack as any).element;
        const isAttached = audioRef.current && trackElement === audioRef.current;
        if (!isAttached) {
          logDebug('[useAudioAttachment] Re-attaching audio track after isTalking changed');
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

  useEffect(() => {
    if (isTalking) {
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

