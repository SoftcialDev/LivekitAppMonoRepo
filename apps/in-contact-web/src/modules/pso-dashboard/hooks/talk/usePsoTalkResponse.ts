/**
 * @fileoverview usePsoTalkResponse - Hook for PSO to respond to talk sessions with microphone
 * @summary Manages microphone publishing for PSO during talk sessions
 * @description Provides functionality for PSO to publish their microphone track to LiveKit
 * when receiving a talk session notification. Handles microphone permission requests,
 * track creation, publishing, and cleanup.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalAudioTrack, createLocalAudioTrack } from 'livekit-client';
import { logWarn, logError, logDebug } from '@/shared/utils/logger';
import type {
  IUsePsoTalkResponseOptions,
  IUsePsoTalkResponse,
} from './types/usePsoTalkResponseTypes';

/**
 * Hook for PSO to publish microphone during talk sessions
 *
 * @param options - Hook configuration options
 * @returns Object containing microphone publishing state and error information
 */
export function usePsoTalkResponse(
  options: IUsePsoTalkResponseOptions
): IUsePsoTalkResponse {
  const { roomRef, isTalkActive } = options;

  const [isMicrophonePublished, setIsMicrophonePublished] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioTrackRef = useRef<LocalAudioTrack | null>(null);

  /**
   * Publishes microphone track to LiveKit room
   */
  const publishMicrophone = useCallback(async (): Promise<void> => {
    const room = roomRef.current;
    if (!room) {
      throw new Error('Room is not connected');
    }

    if (audioTrackRef.current) {
      try {
        await room.localParticipant.publishTrack(audioTrackRef.current);
        setIsMicrophonePublished(true);
        setError(null);
      } catch (err) {
        logWarn('[usePsoTalkResponse] Failed to publish existing track', { error: err });
      }
      return;
    }

    setIsRequestingPermission(true);
    setError(null);

    try {
      const track = await createLocalAudioTrack();
      audioTrackRef.current = track;
      await room.localParticipant.publishTrack(track);
      setIsMicrophonePublished(true);
      setError(null);
      logDebug('[usePsoTalkResponse] Microphone published successfully');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to access microphone';
      setError(errorMessage);
      logError('[usePsoTalkResponse] Failed to publish microphone', { error: err });

      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
        } catch {}
        audioTrackRef.current = null;
      }
      setIsMicrophonePublished(false);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [roomRef]);

  /**
   * Unpublishes and stops microphone track
   */
  const unpublishMicrophone = useCallback(async (): Promise<void> => {
    const room = roomRef.current;
    const track = audioTrackRef.current;

    if (room && track) {
      try {
        await room.localParticipant.unpublishTrack(track, true);
      } catch (err) {
        logWarn('[usePsoTalkResponse] Failed to unpublish track', { error: err });
      }
    }

    if (track) {
      try {
        track.stop();
      } catch (err) {
        logWarn('[usePsoTalkResponse] Failed to stop track', { error: err });
      }
      audioTrackRef.current = null;
    }

    setIsMicrophonePublished(false);
    setError(null);
    logDebug('[usePsoTalkResponse] Microphone unpublished');
  }, [roomRef]);

  /**
   * Effect to handle talk session state changes
   */
  useEffect(() => {
    if (isTalkActive) {
      publishMicrophone().catch((err) => {
        logError('[usePsoTalkResponse] Error publishing microphone', { error: err });
      });
    } else {
      unpublishMicrophone().catch((err) => {
        logError('[usePsoTalkResponse] Error unpublishing microphone', { error: err });
      });
    }
  }, [isTalkActive, publishMicrophone, unpublishMicrophone]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      unpublishMicrophone().catch(() => {});
    };
  }, [unpublishMicrophone]);

  return {
    isMicrophonePublished,
    isRequestingPermission,
    error,
  };
}

