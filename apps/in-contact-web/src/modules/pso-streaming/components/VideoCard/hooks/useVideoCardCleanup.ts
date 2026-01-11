/**
 * @fileoverview useVideoCardCleanup - Custom hook for VideoCard cleanup logic
 * @summary Manages cleanup effects for VideoCard component
 * @description Handles cleanup of talk sessions, video/audio elements, and room disconnection when component unmounts or when streaming stops
 */

import { useEffect, useRef } from 'react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';
import { TalkSessionClient } from '../../../api/talkSessionClient';
import { TalkStopReason } from '@/modules/talk-sessions/enums/talkStopReason';
import { logDebug, logError } from '@/shared/utils/logger';
import type { IUseVideoCardCleanupOptions } from '../types/useVideoCardCleanupTypes';

/**
 * Hook that manages cleanup logic for VideoCard
 * 
 * @param options - Configuration options
 */
export function useVideoCardCleanup(
  options: IUseVideoCardCleanupOptions
): void {
  const {
    roomRef,
    roomName,
    email,
    hasActiveSessionRef,
    activeSessionIdRef,
    videoRef,
    audioRef,
    shouldStream,
    isRecording,
    isTalking,
    stopRecordingIfActive,
    stopTalk,
  } = options;

  const talkSessionClientRef = useRef(new TalkSessionClient());
  const prevShouldStreamRef = useRef<boolean>(shouldStream);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !roomName) {
      return;
    }

    const onParticipantDisconnected = (participant: RemoteParticipant): void => {
      if (participant.identity === roomName) {
        logDebug('[VideoCard] PSO disconnected from LiveKit', { email, roomName });
        const currentHasActiveSession = hasActiveSessionRef.current;
        const currentActiveSessionId = activeSessionIdRef.current;
        if (currentHasActiveSession && currentActiveSessionId) {
          talkSessionClientRef.current
            .stop(currentActiveSessionId, TalkStopReason.PSO_DISCONNECTED)
            .catch((err: unknown) => {
              logError('[VideoCard] Failed to stop talk session on PSO disconnect', {
                error: err,
                email,
                sessionId: currentActiveSessionId,
              });
            });
        }
      }
    };

    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [roomRef, roomName, email, hasActiveSessionRef, activeSessionIdRef]);

  useEffect(() => {
    return () => {
      // Cleanup talk session only if it wasn't already stopped by useTalkback
      // useTalkback will handle stopping the session, so we don't need to do it here
      // This prevents duplicate stop messages (USER_STOP + SUPERVISOR_DISCONNECTED)
      // Note: The session will be stopped by useTalkback's cleanup if still active

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null;
        audioRef.current.src = '';
      }
    };
  }, [email, videoRef, audioRef]);

  useEffect(() => {
    const prev = prevShouldStreamRef.current;
    prevShouldStreamRef.current = shouldStream;
    
    if (prev && !shouldStream) {
      if (isRecording) {
        void stopRecordingIfActive();
      }
      if (isTalking) {
        void stopTalk();
      }
    }
  }, [shouldStream, isRecording, isTalking, stopRecordingIfActive, stopTalk]);
}

