import React, { useRef, useEffect, useState } from 'react'
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from 'livekit-client'
import { useSnapshot } from '../hooks/useSnapshot'
import { usePresenceStore } from '@/shared/presence/usePresenceStore'
import UserIndicator from '@/shared/ui/UserIndicator'
import { VideoCardProps } from '@/shared/types/VideoCardProps'
import AddModal from '@/shared/ui/ModalComponent'
import { useRecording } from '../hooks/useRecording'
import { useTalkback } from '../hooks/useTalkback'

/**
 * VideoCard
 * ----------
 * Displays a LiveKit video/audio stream for one remote user and provides:
 * - Play/Stop (connect/disconnect viewing of the remote stream)
 * - Chat
 * - Mute/Unmute (local playback of the remote user's audio)
 * - Snapshot (open a modal to capture and report a frame)
 * - Talk/Stop Talk (publish/unpublish local mic to speak to the remote user)
 * - Start/Stop Rec (start/stop recording for this participant)
 *
 * Key rules:
 * - **Recording is optional**. It does **not** auto-start on first video frame.
 * - **Stop order**: when stopping stream while recording or talking,
 *   first stop recording (if active), then stop talkback (if active), then toggle the stream.
 * - **Disabled states**:
 *   - **Talk** is disabled when there is no active video (not in Play) or while connecting.
 *   - **Start Rec** is also disabled (greyed out) when there is no active video or while connecting.
 */
const VideoCard: React.FC<VideoCardProps & { livekitUrl?: string }> = ({
  name,
  email,
  onPlay,
  onChat,
  showHeader = true,
  className = '',
  accessToken,
  roomName,
  livekitUrl,
  disableControls = false,
  shouldStream = false,
  connecting = false,
  onToggle,
}) => {
  const roomRef  = useRef<Room | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  /** Local playback mute toggle for the remote audio. */
  const [isAudioMuted, setIsAudioMuted] = useState(true)

  /**
   * Per-card recording controller.
   * NOTE: Must be stopped prior to stopping the stream to avoid backend/API errors.
   * Recording does NOT auto-start; it is explicitly user-triggered.
   */
  const {
    isRecording,
    loading: recordingLoading,
    toggleRecording,
  } = useRecording(roomName!, email!)

  /**
   * Two-way audio (talkback): publish/unpublish the local mic to the same room.
   * Also stopped before stopping the stream.
   */
  const {
    isTalking,
    loading: talkLoading,
    start: startTalk,
    stop: stopTalk,
  } = useTalkback({ roomRef, targetIdentity: roomName })

  /** Reflect mute state in the hidden <audio> element. */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isAudioMuted
    }
  }, [isAudioMuted])

  /**
   * Snapshot helpers (provides `videoRef` used to capture frames).
   */
  const {
    videoRef,
    isModalOpen,
    screenshot,
    reason,
    setReason,
    isSubmitting,
    openModal,
    closeModal,
    confirm,
  } = useSnapshot(email)
  /**
   * Connect to LiveKit and subscribe to the target participant.
   * - Attaches video/audio tracks on subscription.
   * - Calls `onPlay` on the first video attachment (no auto-recording).
   * - Cleans up on unmount or when streaming stops.
   */
  useEffect(() => {
    if (!shouldStream) {
      roomRef.current?.disconnect()
      roomRef.current = null
      return
    }
    if (!accessToken || !roomName || !livekitUrl) {
      return
    }

    let lkRoom: Room | null = null
    let canceled = false


    const attachTrack = (pub: any) => {
      const { track, kind, isSubscribed } = pub
      if (!isSubscribed || !track) return

      if (kind === 'video') {
        (track as RemoteVideoTrack).attach(videoRef.current!)
        
      } else if (kind === 'audio') {
        (track as RemoteAudioTrack).attach(audioRef.current!)
        if (audioRef.current) {
          audioRef.current.muted = isAudioMuted
        }
      }
    }

    const setupParticipant = (p: RemoteParticipant) => {
      for (const pub of p.getTrackPublications().values()) {
        attachTrack(pub)
      }
      p.on(ParticipantEvent.TrackSubscribed, attachTrack)
    }

    const connectAndWatch = async () => {
      const room = new Room()
      try {
        await room.connect(livekitUrl!, accessToken!)
      } catch {
        // Parent can reflect "connecting" externally; ignore here.
      }
      if (canceled) {
        room.disconnect()
        return
      }
      lkRoom = room
      roomRef.current = room

      // Attach to any existing remote participant
      room.remoteParticipants.forEach(p => {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      })
      // Listen for new participants joining
      room.on(RoomEvent.ParticipantConnected, p => {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      })
    }

    void connectAndWatch()

    return () => {
      canceled = true
      lkRoom?.disconnect()
      roomRef.current = null

      // Clean elements
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = ''
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null
        audioRef.current.src = ''
      }
    }
  }, [
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    email,
  ])

  /**
   * Safety net: if an external change flips shouldStream true → false,
   * stop recording first and then stop talkback before teardown.
   */
  const prevShouldRef = useRef<boolean>(shouldStream)
  useEffect(() => {
    const prev = prevShouldRef.current
    prevShouldRef.current = shouldStream
    if (prev && !shouldStream) {
      if (isRecording) {
        void toggleRecording() // stop recording first
      }
      if (isTalking) {
        void stopTalk()        // then stop talkback
      }
    }
  }, [shouldStream, isRecording, isTalking, stopTalk, toggleRecording])

  /** Media is available when actively streaming and not connecting. */
  const mediaReady = shouldStream && !connecting

  // Labels and disabled states
  const playLabel      = connecting ? 'Connecting…' : (shouldStream ? 'Stop' : 'Play')
  const isPlayDisabled = disableControls || connecting
  const talkLabel      = isTalking ? 'Stop Talk' : 'Talk'
  const talkDisabled   = !mediaReady || talkLoading
  const recordDisabled = !mediaReady || recordingLoading  // <- greyed out if no video or connecting

  return (
    <>
      <div className={`flex flex-col bg-[var(--color-primary-dark)] rounded-xl overflow-hidden ${className}`}>
        {showHeader && (
          <div className="flex items-center px-2 py-1">
            <UserIndicator
              user={{
                email,
                name,
                fullName: name,
                status: isPlayDisabled ? 'online' : 'offline',
                azureAdObjectId: roomName ?? null,
              }}
              outerClass="w-5 h-5"
              innerClass="w-4 h-4"
              bgClass="bg-[var(--color-secondary)]"
              borderClass="border-2 border-[var(--color-primary-dark)]"
              nameClass="text-white truncate"
            />
          </div>
        )}

        {/* Video (16:9) */}
        <div className="relative w-full pb-[56.25%] bg-black rounded-xl">
          {(shouldStream || Boolean(accessToken)) ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              No Stream
            </div>
          )}

          {/* Hidden audio element for remote mic */}
          <audio ref={audioRef} autoPlay className="hidden" />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Play / Stop — enforce: stop recording -> stop talk -> toggle */}
          <button
            onClick={async () => {
              if (shouldStream) {
                if (isRecording && !recordingLoading) {
                  await toggleRecording()
                }
                if (isTalking) {
                  await stopTalk()
                }
              }
              onToggle?.(email)
            }}
            disabled={isPlayDisabled || recordingLoading || talkLoading}
            className="flex-1 py-2 bg-white text-[var(--color-primary-dark)] rounded-xl disabled:opacity-50"
            title={shouldStream ? 'Stop stream' : 'Start stream'}
          >
            {recordingLoading || talkLoading ? '...' : playLabel}
          </button>

          <button
            onClick={() => onChat(email)}
            className="flex-1 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded-xl"
          >
            Chat
          </button>

          {/*  <button
            onClick={() => setIsAudioMuted(prev => !prev)}
            className="flex-1 py-2 bg-gray-700 text-white rounded-xl"
          >
            {isAudioMuted ? 'Unmute' : 'Mute'}
          </button> */}

          {/* Talkback 
          <button
            onClick={async () => {
              if (isTalking) {
                await stopTalk()
              } else {
                await startTalk()
              }
            }}
            disabled={talkDisabled}
            className="flex-1 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
            title="Publish your microphone to this user"
          >
            {talkLoading ? '...' : talkLabel}
          </button>*/}

          <button
            onClick={openModal}
            className="flex-1 py-2 bg-yellow-400 rounded-xl"
          >
            Snapshot
          </button>

          {/* Recording — greyed out if no active video or while connecting
          <button
            onClick={toggleRecording}
            disabled={recordDisabled}
            className={`flex-1 py-2 rounded-xl ${isRecording ? 'bg-red-500 text-white' : 'bg-[#BBA6CF] text-white'} disabled:opacity-50`}
            title={!mediaReady ? 'Recording is available only while streaming' : undefined}
          >
            {recordingLoading ? '...' : isRecording ? 'Stop' : 'Record'}
          </button> */}
        </div>
      </div>

      {/* Snapshot Modal */}
      <AddModal
        open={isModalOpen}
        title="Report Snapshot"
        onClose={closeModal}
        onConfirm={confirm}
        confirmLabel="Send"
        loading={isSubmitting}
        className="w-fit"
        loadingAction="Sending…"
      >
        <div className="space-y-4 text-white overflow-y-auto w-full max-h-96 mx-auto">
          <p><strong>PSO:</strong> {email}</p>
          {screenshot && (
            <img
              src={screenshot}
              alt="Snapshot preview"
              className="w-48 h-32 object-cover rounded mx-auto"
            />
          )}
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Enter reason for snapshot"
            className="w-full h-32 p-2 rounded border"
          />
        </div>
      </AddModal>
    </>
  )
}

export default VideoCard
