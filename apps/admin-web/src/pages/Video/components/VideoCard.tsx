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


/**
 * VideoCard
 *
 * Renders a LiveKit video (and audio) stream for a single remote user.
 * Provides Play/Stop, Chat, Mute/Unmute, and Snapshot controls.
 *
 * @param name            Display name of the remote participant.
 * @param email           Email/identity used to join the LiveKit room.
 * @param onPlay          Callback when the first video frame arrives.
 * @param onChat          Callback to open chat with this user.
 * @param showHeader      Whether to render the header with user info.
 * @param className       Additional CSS classes for the outer container.
 * @param accessToken     LiveKit access token.
 * @param roomName        LiveKit room name (should match participant identity).
 * @param livekitUrl      URL of the LiveKit server.
 * @param disableControls If true, always disable Play/Stop button.
 * @param shouldStream    Whether the UI should attempt streaming.
 * @param connecting      True while LiveKit connection is in progress.
 * @param onToggle        Callback when Play/Stop is clicked.
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

  // Local state to mute/unmute remote audio
  const [isAudioMuted, setIsAudioMuted] = useState(true)

  // Apply mute state to the <audio> element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isAudioMuted
    }
  }, [isAudioMuted])

  // Snapshot hook provides videoRef, modal state & handlers
  const {
    videoRef,       // <-- use the hook’s ref for snapshot
    isModalOpen,
    screenshot,
    reason,
    setReason,
    isSubmitting,
    openModal,
    closeModal,
    confirm,
  } = useSnapshot(email)

  // Global presence map (not directly used for audio)
  const streamingMap = usePresenceStore(s => s.streamingMap)
  const isConnected  = Boolean(streamingMap[email])

  useEffect(() => {
    // If we shouldn’t stream, disconnect and clean up
    if (!shouldStream) {
      roomRef.current?.disconnect()
      roomRef.current = null
      return
    }
    // Require valid credentials to connect
    if (!accessToken || !roomName || !livekitUrl) {
      return
    }

    let lkRoom: Room | null = null
    let canceled = false
    let started = false

    /**
     * Attach video and audio tracks to their respective elements.
     */
    function attachTrack(pub: any) {
      const { track, kind, isSubscribed } = pub
      if (!isSubscribed || !track) return

      if (kind === 'video') {
        ;(track as RemoteVideoTrack).attach(videoRef.current!)
        if (!started) {
          started = true
          onPlay(email)
        }
      }
      if (kind === 'audio') {
        ;(track as RemoteAudioTrack).attach(audioRef.current!)
        if (audioRef.current) {
          audioRef.current.muted = isAudioMuted
        }
      }
    }

    /**
     * Set up a participant: attach existing tracks and listen for new ones.
     */
    function setupParticipant(p: RemoteParticipant) {
      for (const pub of p.getTrackPublications().values()) {
        attachTrack(pub)
      }
      p.on(ParticipantEvent.TrackSubscribed, attachTrack)
    }

    /**
     * Connect to LiveKit and subscribe to the target participant.
     */
    async function connectAndWatch() {
      const room = new Room()
      try {
        await room.connect(livekitUrl!, accessToken!)
      } catch {
        // ignore connection errors
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

    connectAndWatch()

    return () => {
      canceled = true
      lkRoom?.disconnect()
      roomRef.current = null

      // Clean up video/audio elements
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
    onPlay,
    // Do NOT include isAudioMuted here, so toggling mute
    // doesn’t reconnect the room—only updates the audio element.
  ])

  // Determine Play/Stop button label
  const playLabel = connecting
    ? 'Connecting…'
    : shouldStream
      ? 'Stop'
      : 'Play'

  const isDisabled = disableControls || connecting

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
                status: isDisabled ? 'online' : 'offline',
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

        {/* Video container (16:9) */}
        <div className="relative w-full pb-[56.25%] bg-black rounded-xl">
          {(shouldStream || Boolean(accessToken)) ? (
            <video
              ref={videoRef}      // <-- now using the hook’s ref
              autoPlay
              playsInline
              muted           // keep local playback muted
              controls={false}
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              No Stream
            </div>
          )}

          {/* Hidden audio element for remote mic */}
          <audio
            ref={audioRef}
            autoPlay
            className="hidden"
          />
        </div>

        {/* Control buttons */}
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => onToggle?.(email)}
            disabled={isDisabled}
            className="flex-1 py-2 bg-white text-[var(--color-primary-dark)] rounded-xl disabled:opacity-50"
          >
            {playLabel}
          </button>
          <button
            onClick={() => onChat(email)}
            className="flex-1 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded-xl"
          >
            Chat
          </button>
          {/* <button
            onClick={() => setIsAudioMuted(prev => !prev)}
            className="flex-1 py-2 bg-gray-700 text-white rounded-xl"
          >
            {isAudioMuted ? 'Unmute' : 'Mute'}
          </button> */}
          <button
            onClick={openModal}
            className="flex-1 py-2 bg-yellow-400 rounded-xl"
          >
            Snapshot
          </button>
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
