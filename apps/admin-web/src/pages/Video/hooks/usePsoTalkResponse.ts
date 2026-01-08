/**
 * @fileoverview usePsoTalkResponse - Hook for PSO to respond to talk sessions with microphone
 * @summary Manages microphone publishing for PSO during talk sessions
 * @description Provides functionality for PSO to publish their microphone track to LiveKit
 * when receiving a talk session notification. Handles microphone permission requests,
 * track creation, publishing, and cleanup.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, LocalAudioTrack, createLocalAudioTrack } from 'livekit-client';

/**
 * Options for the usePsoTalkResponse hook
 */
export interface UsePsoTalkResponseOptions {
  /**
   * Reference to the current LiveKit room
   */
  roomRef: React.RefObject<Room | null>;
  /**
   * Whether the talk session is currently active
   */
  isTalkActive: boolean;
}

/**
 * Return type for usePsoTalkResponse hook
 */
export interface UsePsoTalkResponse {
  /**
   * Whether the microphone is currently published
   */
  isMicrophonePublished: boolean;
  /**
   * Whether microphone permission is being requested
   */
  isRequestingPermission: boolean;
  /**
   * Error message if microphone setup failed
   */
  error: string | null;
}

/**
 * Hook for PSO to publish microphone during talk sessions
 * @param options - Hook configuration options
 * @returns Object containing microphone publishing state and error information
 */
export function usePsoTalkResponse(options: UsePsoTalkResponseOptions): UsePsoTalkResponse {
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
        console.warn('[usePsoTalkResponse] Failed to publish existing track:', err);
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
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to access microphone';
      setError(errorMessage);
      console.error('[usePsoTalkResponse] Failed to publish microphone:', err);
      
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
        console.warn('[usePsoTalkResponse] Failed to unpublish track:', err);
      }
    }

    if (track) {
      try {
        track.stop();
      } catch (err) {
        console.warn('[usePsoTalkResponse] Failed to stop track:', err);
      }
      audioTrackRef.current = null;
    }

    setIsMicrophonePublished(false);
    setError(null);
  }, [roomRef]);

  /**
   * Effect to handle talk session state changes
   */
  useEffect(() => {
    if (isTalkActive) {
      publishMicrophone().catch((err) => {
        console.error('[usePsoTalkResponse] Error publishing microphone:', err);
      });
    } else {
      unpublishMicrophone().catch((err) => {
        console.error('[usePsoTalkResponse] Error unpublishing microphone:', err);
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
    error
  };
}

