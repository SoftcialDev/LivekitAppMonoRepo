import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { Room } from 'livekit-client'
import { createLocalAudioTrack, LocalAudioTrack } from 'livekit-client'

/**
 * Options for {@link useTalkback}.
 *
 * @public
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
  /** Starts publishing the local microphone to the LiveKit room. */
  start: () => Promise<void>
  /** Stops publishing the local microphone to the LiveKit room. */
  stop: () => Promise<void>
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
export function useTalkback(options: UseTalkbackOptions): UseTalkback {
  const { roomRef, targetIdentity, stopOnUnpublish = true } = options

  const [isTalking, setIsTalking] = useState(false)
  const [loading, setLoading] = useState(false)

  // We keep the created LocalAudioTrack to unpublish/stop later.
  const localTrackRef = useRef<LocalAudioTrack | null>(null)

  /**
   * Publish a (new or existing) local mic track to the connected room.
   * Safe to call repeatedly; duplicate publish attempts are ignored.
   */
  const start = useCallback(async () => {
    if (loading || isTalking) return
    setLoading(true)

    try {
      const room = roomRef.current
      if (!room) throw new Error('useTalkback.start(): room is not connected')

      if (localTrackRef.current) {
        // Attempt to (re)publish; if already published, LiveKit may throw—treat as success.
        try {
          await room.localParticipant.publishTrack(localTrackRef.current)
        } catch {
          /* ignore duplicate publish */
        }
        setIsTalking(true)
        return
      }

      // Create mic track and publish it.
      const track = await createLocalAudioTrack()
      localTrackRef.current = track
      await room.localParticipant.publishTrack(track)

      if (targetIdentity) {
        // place for future logging/routing
        // console.debug(`[Talkback] mic published for target "${targetIdentity}"`)
      }

      setIsTalking(true)
    } catch (err) {
      // If publish failed after capture, release the device.
      try {
        localTrackRef.current?.stop()
      } catch {}
      localTrackRef.current = null
      setIsTalking(false)
      throw err
    } finally {
      setLoading(false)
    }
  }, [roomRef, targetIdentity, isTalking, loading])

  /**
   * Unpublish and stop the current mic track (if any).
   * Safe to call repeatedly; will no-op if nothing is active.
   */
  const stop = useCallback(async () => {
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
    } finally {
      setLoading(false)
    }
  }, [roomRef, stopOnUnpublish, loading])

  /**
   * Cleanup on unmount: unpublish and stop any active mic track.
   */
  useEffect(() => {
    return () => {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopOnUnpublish])

  return { isTalking, loading, start, stop }
}
