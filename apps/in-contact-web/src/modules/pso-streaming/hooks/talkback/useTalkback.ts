/**
 * @fileoverview useTalkback hook
 * @summary Hook for managing local microphone publishing (push-to-talk)
 * @description This hook manages two-way audio communication by publishing the local
 * microphone track to a LiveKit room. It includes a countdown before activation,
 * integrates with the backend API for talk session management, and handles browser refresh events.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Room } from 'livekit-client';
import { LocalAudioTrack } from 'livekit-client';
import { TalkSessionClient } from '../../api/talkSessionClient';
import { TalkStopReason } from '../../../talk-sessions/enums/talkStopReason';
import { logError, logDebug } from '@/shared/utils/logger';
import { useAuth } from '@/modules/auth';
import { useTalkSessionGuardStore } from '../../stores/talk-session-guard-store';
import { waitForRoomConnection } from './utils/roomConnection';
import { validateNoActiveSession } from './utils/sessionValidation';
import { startCountdown } from './utils/countdown';
import {
  publishMicrophoneTrack,
  cleanupMicrophoneTrack,
} from './utils/microphoneTrack';
import type { IUseTalkbackOptions, IUseTalkbackReturn } from './types';

/**
 * Publishes a local microphone track to the current LiveKit room (push-to-talk / intercom).
 * 
 * Design goals:
 * - **Idempotent**: calling `start()` twice or `stop()` twice is safe.
 * - **Leak-safe**: unpublishes and stops the local track on unmount.
 * - **Room-aware**: no-ops if the room isn't connected yet.
 * 
 * @param options - IUseTalkbackOptions
 * @returns IUseTalkbackReturn
 */
export function useTalkback(options: IUseTalkbackOptions): IUseTalkbackReturn {
  const { roomRef, psoEmail, stopOnUnpublish = true } = options;
  const { getApiToken } = useAuth();
  const { registerSession, unregisterSession } = useTalkSessionGuardStore();

  const [isTalking, setIsTalking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const talkSessionIdRef = useRef<string | null>(null);
  const cancelCountdownRef = useRef<(() => void) | null>(null);
  const talkSessionClientRef = useRef(new TalkSessionClient());
  const hasStoppedRef = useRef<boolean>(false); // Track if stop has been called to prevent duplicate stops

  /**
   * Stops the talk session via API
   * Prevents duplicate stops by checking hasStoppedRef
   */
  const stopTalkSession = useCallback(async (reason: TalkStopReason): Promise<void> => {
    if (!talkSessionIdRef.current || hasStoppedRef.current) {
      return;
    }

    hasStoppedRef.current = true;
    const sessionId = talkSessionIdRef.current;
    talkSessionIdRef.current = null;

    try {
      await talkSessionClientRef.current.stop(sessionId, reason);
    } catch {
      // ignore stop errors during cleanup
    }
  }, []);

  /**
   * Cancels an active countdown and stops the talk session if started
   */
  const cancel = useCallback(() => {
    if (cancelCountdownRef.current) {
      cancelCountdownRef.current();
      cancelCountdownRef.current = null;
    }

    setCountdown(null);
    setIsCountdownActive(false);

    if (talkSessionIdRef.current && psoEmail) {
      void stopTalkSession(TalkStopReason.USER_STOP);
    }
  }, [psoEmail, stopTalkSession]);

  /**
   * Starts a talk session via API
   */
  const startTalkSession = useCallback(async (): Promise<void> => {
    if (!psoEmail) {
      return;
    }

    // Reset stop flag when starting new session
    hasStoppedRef.current = false;

    await validateNoActiveSession(
      (email: string) => talkSessionClientRef.current.checkActiveSession(email),
      psoEmail
    );

    const response = await talkSessionClientRef.current.start(psoEmail);
    talkSessionIdRef.current = response.talkSessionId;
  }, [psoEmail]);

  /**
   * Handles successful microphone publishing after countdown
   */
  const handleMicrophonePublished = useCallback(async (room: Room): Promise<void> => {
    const track = await publishMicrophoneTrack(room, localTrackRef.current);
    localTrackRef.current = track;
    setIsTalking(true);

    // Register session in guard store for navigation blocking
    // This allows navigation blocking when there's an active talk session
    if (psoEmail) {
      const stopFunction = async (): Promise<void> => {
        // Stop the talk session with USER_STOP reason when navigating away
        await stopTalkSession(TalkStopReason.USER_STOP);
        // Cleanup local track
        if (localTrackRef.current) {
          cleanupMicrophoneTrack(roomRef.current, localTrackRef.current, stopOnUnpublish);
          localTrackRef.current = null;
        }
        setIsTalking(false);
        // Unregister from guard store after stopping
        unregisterSession(psoEmail);
      };
      registerSession(psoEmail, stopFunction);
      logDebug('[useTalkback] Registered session in guard store', { email: psoEmail });
    }
  }, [psoEmail, stopTalkSession, registerSession, unregisterSession, roomRef, stopOnUnpublish]);

  /**
   * Handles errors during microphone publishing
   */
  const handleMicrophonePublishError = useCallback(async (error: unknown): Promise<void> => {
    cleanupMicrophoneTrack(roomRef.current, localTrackRef.current, stopOnUnpublish);
    localTrackRef.current = null;
    setIsTalking(false);

    if (talkSessionIdRef.current && psoEmail) {
      await stopTalkSession(TalkStopReason.CONNECTION_ERROR);
    }

    throw error;
  }, [roomRef, stopOnUnpublish, psoEmail, stopTalkSession]);

  /**
   * Starts a talk session with countdown and microphone publishing
   */
  const start = useCallback(async () => {
    if (loading || isTalking || isCountdownActive) {
      return;
    }

    setLoading(true);

    try {
      const room = await waitForRoomConnection(() => roomRef.current);
      await startTalkSession();

      setIsCountdownActive(true);

      const cancelFn = startCountdown({
        onCountdownUpdate: setCountdown,
        onCountdownStart: () => {
          setIsCountdownActive(true);
        },
        onCountdownEnd: () => {
          setIsCountdownActive(false);
        },
        onComplete: async () => {
          try {
            await handleMicrophonePublished(room);
          } catch (err) {
            await handleMicrophonePublishError(err);
          }
        },
      });

      cancelCountdownRef.current = cancelFn;
    } catch (err) {
      cancel();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    isTalking,
    isCountdownActive,
    startTalkSession,
    handleMicrophonePublished,
    handleMicrophonePublishError,
    cancel,
  ]);

  /**
   * Stops the talk session and unpublishes the microphone track
   */
  const stop = useCallback(async () => {
    cancel();

    if (loading || !localTrackRef.current) {
      setIsTalking(false);
      return;
    }

    setLoading(true);
    try {
      cleanupMicrophoneTrack(roomRef.current, localTrackRef.current, stopOnUnpublish);
      localTrackRef.current = null;
      setIsTalking(false);

      // Unregister from guard store before stopping
      if (psoEmail) {
        unregisterSession(psoEmail);
        logDebug('[useTalkback] Unregistered session from guard store', { email: psoEmail });
      }

      await stopTalkSession(TalkStopReason.USER_STOP);
    } finally {
      setLoading(false);
    }
  }, [loading, roomRef, stopOnUnpublish, cancel, stopTalkSession, psoEmail, unregisterSession]);

  /**
   * Cleanup on unmount: unpublish and stop any active mic track
   */
  useEffect(() => {
    return () => {
      cancel();

      cleanupMicrophoneTrack(roomRef.current, localTrackRef.current, stopOnUnpublish);
      localTrackRef.current = null;
      setIsTalking(false);

      // Unregister from guard store on unmount
      if (psoEmail) {
        unregisterSession(psoEmail);
        logDebug('[useTalkback] Unregistered session from guard store on unmount', { email: psoEmail });
      }

      if (talkSessionIdRef.current) {
        void stopTalkSession(TalkStopReason.BROWSER_REFRESH);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopOnUnpublish, psoEmail, unregisterSession]);

  /**
   * Handle browser refresh/unload using fetch with keepalive
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (talkSessionIdRef.current) {
        void talkSessionClientRef.current.sendBeaconStop(
          talkSessionIdRef.current,
          TalkStopReason.BROWSER_REFRESH,
          getApiToken
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [getApiToken]);

  return { isTalking, loading, countdown, isCountdownActive, start, stop, cancel };
}
