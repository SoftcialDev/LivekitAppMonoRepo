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
  onToggle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const roomRef  = useRef<Room | null>(null)

  useEffect(() => {
    console.log(`[VideoCard:${email}] useEffect fired`, {
      shouldStream,
      accessToken,
      roomName,
      livekitUrl,
    })

    // 1) Si no hay intención de stream, desconecta y sal
    if (!shouldStream) {
      console.log(`[VideoCard:${email}] shouldStream=false → disconnecting if needed`)
      roomRef.current?.disconnect()
      roomRef.current = null
      return
    }

    // 2) Si quiere stream pero aún no hay credenciales, espera sin conectar
    if (!accessToken || !roomName || !livekitUrl) {
      console.log(
        `[VideoCard:${email}] waiting for credentials`,
        { accessToken, roomName, livekitUrl }
      )
      return
    }

    console.log(
      `[VideoCard:${email}] shouldStream=true & credentials present → will connect`
    )

    const vid = videoRef.current!
    let lkRoom: Room | null = null
    let canceled = false
    let started = false

    function attachIfVideo(pub: any) {
      const track = pub.track
      if (pub.kind === 'video' && pub.isSubscribed && track) {
        console.log(`[VideoCard:${email}] attaching video track`, pub)
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
      p.getTrackPublications().forEach(pub => {
        attachIfVideo(pub)
      })
      // nuevas pistas
      p.on(ParticipantEvent.TrackSubscribed, track => {
        console.log(`[VideoCard:${email}] ParticipantEvent.TrackSubscribed`)
        if (track.kind === 'video') {
          attachIfVideo(track)
        }
      })
      // cuando dejan de publicar
      const drop = () => {
        console.log(`[VideoCard:${email}] track stopped/unpublished → onStop`)
        onStop(email)
      }
      p.on(ParticipantEvent.TrackUnsubscribed, drop)
      p.on(ParticipantEvent.TrackUnpublished,  drop)
    }

    async function connectAndWatch() {
      console.log(`[VideoCard:${email}] connectAndWatch() → connecting to`, livekitUrl)
      const room = new Room()
      try {
        await room.connect(livekitUrl as string, accessToken as string)
        console.log(`[VideoCard:${email}] connected to LiveKit room`)
      } catch (e) {
        console.warn(`[VideoCard:${email}] connection error`, e)
      }
      if (canceled) {
        console.log(`[VideoCard:${email}] connection canceled, disconnecting`)
        room.disconnect()
        return
      }
      lkRoom = room
      roomRef.current = room

      room.on(RoomEvent.Disconnected,      () => {
        console.log(`[VideoCard:${email}] RoomEvent.Disconnected`)
        onStop(email)
      })
      room.remoteParticipants.forEach(p => {
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      })
      room.on(RoomEvent.ParticipantConnected, p => {
        console.log(`[VideoCard:${email}] ParticipantConnected:`, p.identity)
        if (p.identity === roomName) {
          setupParticipant(p)
        }
      })
      room.on(RoomEvent.ParticipantDisconnected, p => {
        console.log(`[VideoCard:${email}] ParticipantDisconnected:`, p.identity)
        if (p.identity === roomName) {
          onStop(email)
        }
      })
    }

    connectAndWatch()

    return () => {
      console.log(`[VideoCard:${email}] cleanup effect`)
      canceled = true
      if (lkRoom) {
        console.log(`[VideoCard:${email}] disconnecting roomRef`)
        lkRoom.disconnect()
      }
      roomRef.current = null
      if (vid) {
        vid.srcObject = null
        vid.src       = ''
      }
    }
  }, [
    shouldStream,
    accessToken,
    roomName,
    livekitUrl,
    email,
    onPlay,
    onStop,
  ])

  // decide si hay vídeo por credenciales originales o por toggle
  const hasVideoOriginal = Boolean(accessToken && roomName && livekitUrl)
  const active = hasVideoOriginal || shouldStream

  return (
    <div className={`flex flex-col h-full bg-[var(--color-primary-dark)] rounded-xl overflow-hidden ${className}`}>
      {showHeader && (
        <div className="flex items-center px-2 py-1">
          <UserIndicator
            user={{
              email,
              name,
              fullName: name,
              status: active ? 'online' : 'offline',
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
        {active ? (
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
            console.log(`[VideoCard:${email}] onToggle clicked (active=${active})`)
            onToggle?.(email)
          }}
          className="flex-1 py-2 bg-white text-[var(--color-primary-dark)] rounded-xl"
        >
          {active ? 'Stop' : 'Play'}
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
