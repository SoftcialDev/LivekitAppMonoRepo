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
  shouldStream = false,
  connecting = false,   // nueva prop para desactivar botón
  onToggle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const roomRef  = useRef<Room | null>(null)

  useEffect(() => {
    console.log(`[VideoCard:${email}] useEffect`, { shouldStream, accessToken, roomName, livekitUrl })

    // 1) Si admin quita el stream, desconecta y salimos
    if (!shouldStream) {
      console.log(`[VideoCard:${email}] shouldStream=false → disconnecting`)
      roomRef.current?.disconnect()
      roomRef.current = null
      return
    }

    // 2) Si aún no tenemos token/URL, esperamos
    if (!accessToken || !roomName || !livekitUrl) {
      console.log(`[VideoCard:${email}] waiting for credentials`, { accessToken, roomName, livekitUrl })
      return
    }

    console.log(`[VideoCard:${email}] credentials ok & shouldStream → connecting`)

    const vid = videoRef.current!
    let lkRoom: Room | null = null
    let canceled = false
    let started = false

    function attachIfVideo(pub: any) {
      const track = pub.track
      if (pub.kind === 'video' && pub.isSubscribed && track) {
        console.log(`[VideoCard:${email}] attaching track`, pub.sid)
        ;(track as RemoteVideoTrack).attach(vid)
        if (!started) {
          started = true
          console.log(`[VideoCard:${email}] first frame → onPlay`)
          onPlay(email)
        }
      }
    }

    function setupParticipant(p: RemoteParticipant) {
      console.log(`[VideoCard:${email}] setupParticipant for`, p.identity)
      // pistas ya publicadas
      for (const pub of p.getTrackPublications().values()) {
        attachIfVideo(pub)
      }
      // nuevas pistas
      p.on(ParticipantEvent.TrackSubscribed, attachIfVideo)
      // **quitamos** el onStop en unsubscribed/unpublished
    }

    async function connectAndWatch() {
      console.log(`[VideoCard:${email}] connectAndWatch →`, livekitUrl)
      const room = new Room()
      try {
        await room.connect(livekitUrl as string, accessToken as string)
        console.log(`[VideoCard:${email}] livekit connected`)
      } catch (e) {
        console.warn(`[VideoCard:${email}] connection error`, e)
      }
      if (canceled) {
        console.log(`[VideoCard:${email}] canceled → disconnect`)
        room.disconnect()
        return
      }
      lkRoom = room
      roomRef.current = room

      // **quitamos**: room.on(RoomEvent.Disconnected, () => onStop(email))
      room.on(RoomEvent.Disconnected, () => {
        console.log(`[VideoCard:${email}] RoomEvent.Disconnected → internal stop`)
      })

      // subscribe a todos los participantes
      room.remoteParticipants.forEach(p => {
        if (p.identity === roomName) setupParticipant(p)
      })
      room.on(RoomEvent.ParticipantConnected, p => {
        if (p.identity === roomName) setupParticipant(p)
      })
      // **quitamos**: ParticipantDisconnected → onStop
    }

    connectAndWatch()

    return () => {
      console.log(`[VideoCard:${email}] cleanup effect`)
      canceled = true
      lkRoom?.disconnect()
      roomRef.current = null
      if (vid) {
        vid.srcObject = null
        vid.src       = ''
      }
    }
  }, [shouldStream, accessToken, roomName, livekitUrl, email, onPlay])

  // Label + disabled during connecting
  const label = connecting
    ? 'Connecting…'
    : shouldStream
      ? 'Stop'
      : 'Play'

  return (
    <div className={`flex flex-col h-full bg-[var(--color-primary-dark)] rounded-xl overflow-hidden ${className}`}>
      {showHeader && (
        <div className="flex items-center px-2 py-1">
          <UserIndicator
            user={{
              email,
              name,
              fullName: name,
              status: (shouldStream || Boolean(accessToken)) ? 'online' : 'offline',
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
        {(shouldStream || Boolean(accessToken)) ? (
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
          onClick={() => {
            console.log(`[VideoCard:${email}] onToggle clicked (connecting=${connecting})`)
            onToggle?.(email)
          }}
          disabled={connecting}
          className="flex-1 py-2 bg-white text-[var(--color-primary-dark)] rounded-xl disabled:opacity-50"
        >
          {label}
        </button>
        <button
          onClick={() => {
            console.log(`[VideoCard:${email}] onChat clicked`)
            onChat(email)
          }}
          className="flex-1 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded-xl"
        >
          Chat
        </button>
      </div>
    </div>
  )
}

export default VideoCard
