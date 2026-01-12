/**
 * @fileoverview useTalkback hook
 * @summary Hook for managing local microphone publishing (push-to-talk)
 * @description This hook manages two-way audio communication by publishing the local
 * microphone track to a LiveKit room. It includes a countdown before activation,
 * integrates with the backend API for talk session management, and handles browser refresh events.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const { registerSession, unregisterSession, hasActiveSessions, getActiveSessionEmails } = useTalkSessionGuardStore();

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
   * 
   * Prevents duplicate stops by checking hasStoppedRef. This ensures that
   * even if stopTalkSession is called multiple times, it only executes once.
   * Errors during stop are silently ignored as they typically occur during cleanup.
   *
   * @param reason - Reason for stopping the talk session
   * @returns Promise that resolves when the stop operation completes
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
   * 
   * This function is called when the user manually cancels the countdown
   * or when an error occurs during the start process. It cleans up the
   * countdown state and stops any active talk session.
   */
  const cancel = useCallback(() => {
    if (cancelCountdownRef.current) {
      cancelCountdownRef.current();
      cancelCountdownRef.current = null;
    }

    setCountdown(null);
    setIsCountdownActive(false);

    if (talkSessionIdRef.current && psoEmail) {
      stopTalkSession(TalkStopReason.USER_STOP).catch((err) => {
        logError('[useTalkback] Error stopping talk session in cancel', { error: err });
      });
    }
  }, [psoEmail, stopTalkSession]);

  /**
   * Starts a talk session via API
   * 
   * Validates that no active session exists for the PSO, then creates a new
   * talk session. The session ID is stored in talkSessionIdRef for later use
   * in stop operations. Resets the stop flag when starting a new session.
   *
   * @returns Promise that resolves when the session is started
   * @throws Error if psoEmail is not provided or if validation fails
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
   * Creates the stop function for session registration
   * 
   * This function factory creates a cleanup function that is registered with
   * the talk session guard store. The returned function handles:
   * - Canceling active countdowns
   * - Stopping the talk session via API
   * - Cleaning up local microphone tracks
   * - Resetting all state
   * - Unregistering from the guard store
   *
   * @returns Async function that performs complete cleanup of the talk session
   */
  const createStopFunction = useCallback((): (() => Promise<void>) => {
    return async (): Promise<void> => {
      // Cancel countdown if active
      if (cancelCountdownRef.current) {
        cancelCountdownRef.current();
        cancelCountdownRef.current = null;
      }
      // Stop the talk session with USER_STOP reason when navigating away
      await stopTalkSession(TalkStopReason.USER_STOP);
      // Cleanup local track if it exists (may not exist yet if countdown hasn't completed)
      if (localTrackRef.current) {
        cleanupMicrophoneTrack(roomRef.current, localTrackRef.current, stopOnUnpublish);
        localTrackRef.current = null;
      }
      setIsTalking(false);
      setIsCountdownActive(false);
      setCountdown(null);
      // Unregister from guard store after stopping
      if (psoEmail) {
        unregisterSession(psoEmail);
      }
    };
  }, [stopTalkSession, roomRef, stopOnUnpublish, psoEmail, unregisterSession]);

  /**
   * Handles successful microphone publishing after countdown
   * 
   * This function is called when the countdown completes and the microphone
   * track is successfully published to the LiveKit room. It updates the
   * session registration in the guard store with the final stop function
   * that includes track cleanup.
   *
   * @param room - The LiveKit room instance
   * @returns Promise that resolves when publishing is complete
   */
  const handleMicrophonePublished = useCallback(async (room: Room): Promise<void> => {
    const track = await publishMicrophoneTrack(room, localTrackRef.current);
    localTrackRef.current = track;
    setIsTalking(true);

    // Update session in guard store with final stop function that includes track cleanup
    // The session was already registered in start() before countdown, now we update it
    if (psoEmail) {
      const stopFunction = createStopFunction();
      registerSession(psoEmail, stopFunction);
      logDebug('[useTalkback] Updated session in guard store with track cleanup', { email: psoEmail });
    }
  }, [psoEmail, registerSession, createStopFunction]);

  /**
   * Handles errors during microphone publishing
   * 
   * This function is called when an error occurs while publishing the
   * microphone track. It performs cleanup (track removal, state reset)
   * and stops the talk session with a CONNECTION_ERROR reason before
   * re-throwing the error.
   *
   * @param error - The error that occurred during publishing
   * @returns Promise that rejects with the original error
   * @throws The original error after cleanup is complete
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
   * 
   * This is the main entry point for starting a talk session. It:
   * 1. Validates that no active session exists
   * 2. Waits for room connection
   * 3. Starts the talk session via API
   * 4. Registers the session in the guard store for navigation blocking
   * 5. Starts a countdown before publishing the microphone
   * 6. Publishes the microphone track after countdown completes
   *
   * The function is idempotent - calling it multiple times while already
   * starting/talking will be ignored.
   *
   * @returns Promise that resolves when the session is fully started
   * @throws Error if validation fails, room connection fails, or publishing fails
   */
  const start = useCallback(async () => {
    if (loading || isTalking || isCountdownActive) {
      return;
    }

    // Check if admin already has an active talk session (only one session per admin)
    if (hasActiveSessions()) {
      const activeEmails = getActiveSessionEmails();
      const activeEmail = activeEmails[0];
      logDebug('[useTalkback] Admin already has an active talk session', { activeEmail, psoEmail });
      throw new Error(
        `You already have an active talk session with ${activeEmail}. Please end the current session before starting a new one.`
      );
    }

    setLoading(true);

    try {
      const room = await waitForRoomConnection(() => roomRef.current);
      await startTalkSession();

      // Register session in guard store for navigation blocking (including during countdown)
      // This allows navigation blocking from the start, even before microphone is published
      if (psoEmail) {
        const stopFunction = createStopFunction();
        registerSession(psoEmail, stopFunction);
        logDebug('[useTalkback] Registered session in guard store (during countdown)', { email: psoEmail });
      }

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
    psoEmail,
    registerSession,
    createStopFunction,
    hasActiveSessions,
    getActiveSessionEmails,
  ]);

  /**
   * Stops the talk session and unpublishes the microphone track
   * 
   * This function stops the talk session and cleans up all resources:
   * - Cancels any active countdown
   * - Unpublishes and stops the microphone track
   * - Unregisters from the guard store
   * - Stops the talk session via API
   *
   * The function is idempotent - calling it multiple times is safe.
   *
   * @returns Promise that resolves when the session is fully stopped
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
   * 
   * This effect runs cleanup when the component unmounts. It:
   * - Cancels any active countdown
   * - Cleans up the microphone track
   * - Resets all state
   * - Unregisters from the guard store
   * - Stops the talk session with BROWSER_REFRESH reason
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
        stopTalkSession(TalkStopReason.BROWSER_REFRESH).catch((err) => {
          logError('[useTalkback] Error stopping talk session on unmount', { error: err });
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopOnUnpublish, psoEmail, unregisterSession]);

  /**
   * Handle browser refresh/unload using fetch with keepalive
   * 
   * This effect sets up a beforeunload event listener to send a beacon
   * request to stop the talk session when the user refreshes or closes
   * the browser tab. Uses sendBeaconStop which uses fetch with keepalive
   * to ensure the request completes even if the page is unloading.
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (talkSessionIdRef.current) {
        talkSessionClientRef.current.sendBeaconStop(
          talkSessionIdRef.current,
          TalkStopReason.BROWSER_REFRESH,
          getApiToken
        ).catch((err) => {
          logError('[useTalkback] Error sending beacon stop on beforeunload', { error: err });
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [getApiToken]);

  return { isTalking, loading, countdown, isCountdownActive, start, stop, cancel };
}
