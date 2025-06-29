import React, { useRef, useEffect } from 'react'
import UserIndicator from '../../../components/UserIndicator'
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteVideoTrack,
} from 'livekit-client'
import type { VideoCardProps } from '../types/VideoCardProps'

const VideoCard: React.FC<VideoCardProps & { livekitUrl?: string }> = ({
  name,
  email,
  onStop,
  onPlay,
  onChat,
  showHeader = true,
  className = '',
  accessToken,
  roomName,
  livekitUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const roomRef  = useRef<Room | null>(null)

  useEffect(() => {
    if (!accessToken || !roomName || !livekitUrl) {
      return
    }

    const vid = videoRef.current!
    let lkRoom: Room | null = null
    let canceled = false
    let started = false  // tracker para solo llamar onPlay una vez

    function attachIfVideo(pub: any) {
      const track = pub.track
      if (pub.kind === 'video' && pub.isSubscribed && track) {
        ;(track as RemoteVideoTrack).attach(vid)
        if (!started) {
          started = true
          onPlay(email)
        }
      }
    }

    function setupParticipant(p: RemoteParticipant) {
      // suscribe publicaciones existentes
      for (const pub of p.getTrackPublications().values()) {
        attachIfVideo(pub)
      }
      // nuevas suscripciones
      p.on(ParticipantEvent.TrackSubscribed, track => {
        if (track.kind === 'video') {
          ;(track as RemoteVideoTrack).attach(vid)
          if (!started) {
            started = true
            onPlay(email)
          }
        }
      })
      // cuando el participante deja de publicar video
      p.on(ParticipantEvent.TrackUnsubscribed, track => {
        if (track.kind === 'video') {
          onStop(email)
        }
      })
      p.on(ParticipantEvent.TrackUnpublished, pub => {
        if (pub.kind === 'video') {
          onStop(email)
        }
      })
    }

    async function connectAndWatch() {
      const room = new Room()
      try {
        await room.connect(livekitUrl!, accessToken!)
      } catch (e) {
        console.warn('[VideoCard] connection error', e)
      }
      if (canceled) {
        room.disconnect()
        return
      }
      lkRoom = room
      roomRef.current = room

      // Avisar si el room cae por completo
      room.on(RoomEvent.Disconnected, () => {
        onStop(email)
      })

      // subscribe a los que ya están
      for (const p of room.remoteParticipants.values()) {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      }
      // nuevos participantes entrando
      room.on(RoomEvent.ParticipantConnected, p => {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      })
      // participante sale de la sala
      room.on(RoomEvent.ParticipantDisconnected, p => {
        if (p.identity === roomName) {
          onStop(email)
        }
      })
    }

    connectAndWatch()

    return () => {
      canceled = true
      if (lkRoom) lkRoom.disconnect()
      roomRef.current = null
      if (vid) {
        vid.srcObject = null
        vid.src       = ''
      }
    }
  }, [accessToken, roomName, livekitUrl, email, onPlay, onStop])

  const hasVideo = Boolean(accessToken && roomName && livekitUrl)

  return (
    <div className={`flex flex-col h-full bg-[var(--color-primary-dark)] rounded-xl overflow-hidden ${className}`}>
      {showHeader && (
        <div className="flex items-center px-2 py-1">
          <UserIndicator
            user={{
              email,
              name,
              fullName: name,
              status: hasVideo ? 'online' : 'offline',
              azureAdObjectId: roomName,
            }}
            outerClass="w-5 h-5"
            innerClass="w-4 h-4"
            bgClass="bg-[var(--color-secondary)]"
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass="text-white truncate"
          />
        </div>
      )}

      <div className="flex-1 bg-black overflow-hidden rounded-xl">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            No Stream
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => (hasVideo ? onStop(email) : onPlay(email))}
          className="flex-1 py-2 bg-white text-[var(--color-primary-dark)] rounded-xl"
        >
          {hasVideo ? 'Stop' : 'Play'}
        </button>
        <button
          onClick={() => onChat(email)}
          className="flex-1 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded-xl"
        >
          Chat
        </button>
      </div>
    </div>
  )
}

export default VideoCard
