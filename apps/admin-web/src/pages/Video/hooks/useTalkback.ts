/**
 * @fileoverview useTalkback.ts - Hook for managing local microphone publishing (push-to-talk)
 * @summary Provides functionality to publish/unpublish local microphone to LiveKit room
 * @description This hook manages two-way audio communication by publishing the local
 * microphone track to a LiveKit room. It includes a countdown before activation,
 * integrates with the backend API for talk session management, plays notification
 * sounds, and handles browser refresh events.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { Room } from 'livekit-client'
import { createLocalAudioTrack, LocalAudioTrack } from 'livekit-client'
import { TalkSessionClient } from '@/shared/api/talkSessionClient'
import { TalkStopReason } from '@/shared/types/talkSession'

/**
 * Options for {@link useTalkback}.
 */
export interface UseTalkbackOptions {
  /**
   * Reference to the current LiveKit {@link Room}.
   * The hook publishes/unpublishes the local mic track to this room.
   */
  roomRef: MutableRefObject<Room | null>

  /**
   * Optional identity of the intended recipient (remote participant).
   * Not required for publishing (server forwards to the room), but useful for logging or future routing.
   */
  targetIdentity?: string

  /**
   * Email of the PSO to start a talk session with.
   * If provided, the hook will call TalkSessionStart/Stop APIs.
   */
  psoEmail?: string

  /**
   * Whether to stop the underlying MediaStreamTrack when unpublishing.
   * Defaults to `true`.
   */
  stopOnUnpublish?: boolean
}

/**
 * Return type of {@link useTalkback}.
 *
 * @public
 */
export interface UseTalkback {
  /** `true` while the local microphone is currently published to the room. */
  isTalking: boolean
  /** `true` while starting/stopping the talkback flow. */
  loading: boolean
  /** Current countdown value (3, 2, 1, or null) */
  countdown: number | null
  /** `true` if countdown is active */
  isCountdownActive: boolean
  /** Starts publishing the local microphone to the LiveKit room. */
  start: () => Promise<void>
  /** Stops publishing the local microphone to the LiveKit room. */
  stop: () => Promise<void>
  /** Cancels an active countdown */
  cancel: () => void
}

/**
 * useTalkback
 * -----------
 * Publishes a local microphone track to the current LiveKit room (push-to-talk / intercom).
 *
 * Design goals:
 * - **Idempotent**: calling `start()` twice or `stop()` twice is safe.
 * - **Leak-safe**: unpublishes and stops the local track on unmount.
 * - **Room-aware**: no-ops if the room isn’t connected yet.
 *
 * Minimal usage:
 * ```tsx
 * const { isTalking, loading, start, stop } = useTalkback({ roomRef });
 * <button onClick={() => (isTalking ? stop() : start())} disabled={loading} />
 * ```
 *
 * @param options - {@link UseTalkbackOptions}
 * @returns {@link UseTalkback}
 *
 * @public
 */
const COUNTDOWN_DURATION_MS = 3000;
const COUNTDOWN_INTERVAL_MS = 1000;

export function useTalkback(options: UseTalkbackOptions): UseTalkback {
  const { roomRef, targetIdentity, psoEmail, stopOnUnpublish = true } = options

  const [isTalking, setIsTalking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCountdownActive, setIsCountdownActive] = useState(false)

  const localTrackRef = useRef<LocalAudioTrack | null>(null)
  const talkSessionIdRef = useRef<string | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const talkSessionClientRef = useRef(new TalkSessionClient())

  /**
   * Cancels an active countdown and stops the talk session if started
   */
  const cancel = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdown(null)
    setIsCountdownActive(false)

    if (talkSessionIdRef.current && psoEmail) {
      talkSessionClientRef.current
        .stop(talkSessionIdRef.current, TalkStopReason.USER_STOP)
        .catch(() => {})
      talkSessionIdRef.current = null
    }
  }, [psoEmail])

  /**
   * Publishes the microphone track to LiveKit room
   */
  const publishMicrophone = useCallback(async (): Promise<void> => {
    const room = roomRef.current
    if (!room) throw new Error('useTalkback.start(): room is not connected')

    if (localTrackRef.current) {
      try {
        await room.localParticipant.publishTrack(localTrackRef.current)
      } catch {
        /* ignore duplicate publish */
      }
      return
    }

    const track = await createLocalAudioTrack()
    localTrackRef.current = track
    await room.localParticipant.publishTrack(track)
  }, [roomRef])

  /**
   * Starts a talk session with countdown and microphone publishing
   */
  const start = useCallback(async () => {
    if (loading || isTalking || isCountdownActive) return
    setLoading(true)

    try {
      const room = roomRef.current
      if (!room) throw new Error('useTalkback.start(): room is not connected')

      if (psoEmail) {
        const response = await talkSessionClientRef.current.start(psoEmail)
        talkSessionIdRef.current = response.talkSessionId
      }

      setIsCountdownActive(true)
      setCountdown(3)

      let currentCountdown = 3
      const countdownInterval = setInterval(() => {
        currentCountdown -= 1
        if (currentCountdown > 0) {
          setCountdown(currentCountdown)
        } else {
          clearInterval(countdownInterval)
          setCountdown(null)
          setIsCountdownActive(false)
        }
      }, COUNTDOWN_INTERVAL_MS)

      countdownTimerRef.current = window.setTimeout(async () => {
        clearInterval(countdownInterval)
        setCountdown(null)
        setIsCountdownActive(false)

        try {
          await publishMicrophone()
          setIsTalking(true)
        } catch (err) {
          try {
            localTrackRef.current?.stop()
          } catch {}
          localTrackRef.current = null
          setIsTalking(false)

          if (talkSessionIdRef.current && psoEmail) {
            await talkSessionClientRef.current.stop(
              talkSessionIdRef.current,
              TalkStopReason.CONNECTION_ERROR
            )
            talkSessionIdRef.current = null
          }

          throw err
        }
      }, COUNTDOWN_DURATION_MS)
    } catch (err) {
      cancel()
      throw err
    } finally {
      setLoading(false)
    }
  }, [roomRef, psoEmail, loading, isTalking, isCountdownActive, publishMicrophone, cancel])

  /**
   * Stops the talk session and unpublishes the microphone track
   */
  const stop = useCallback(async () => {
    cancel()

    if (loading || !localTrackRef.current) {
      setIsTalking(false)
      return
    }

    setLoading(true)
    try {
      const room = roomRef.current
      if (room) {
        try {
          room.localParticipant.unpublishTrack(localTrackRef.current, stopOnUnpublish)
        } catch {
          /* ignore unpublish errors */
        }
      }
      try {
        localTrackRef.current.stop()
      } catch {}
      localTrackRef.current = null
      setIsTalking(false)

      if (talkSessionIdRef.current) {
        try {
          await talkSessionClientRef.current.stop(
            talkSessionIdRef.current,
            TalkStopReason.USER_STOP
          )
        } catch {
          /* ignore stop errors */
        }
        talkSessionIdRef.current = null
      }
    } finally {
      setLoading(false)
    }
  }, [roomRef, stopOnUnpublish, loading, cancel])

  /**
   * Cleanup on unmount: unpublish and stop any active mic track.
   */
  useEffect(() => {
    return () => {
      cancel()

      try {
        const room = roomRef.current
        const track = localTrackRef.current
        if (room && track) {
          try {
            room.localParticipant.unpublishTrack(track, stopOnUnpublish)
          } catch {}
        }
        if (track) {
          try {
            track.stop()
          } catch {}
        }
      } finally {
        localTrackRef.current = null
        setIsTalking(false)
      }

      if (talkSessionIdRef.current) {
        talkSessionClientRef.current
          .stop(talkSessionIdRef.current, TalkStopReason.BROWSER_REFRESH)
          .catch(() => {})
        talkSessionIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopOnUnpublish, cancel])

  /**
   * Handle browser refresh/unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (talkSessionIdRef.current) {
        navigator.sendBeacon(
          '/api/TalkSessionStop',
          JSON.stringify({
            talkSessionId: talkSessionIdRef.current,
            stopReason: TalkStopReason.BROWSER_REFRESH
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return { isTalking, loading, countdown, isCountdownActive, start, stop, cancel }
}
