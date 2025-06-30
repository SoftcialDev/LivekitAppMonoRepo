import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { usePresence } from '../../navigation/hooks/usePresence'
import { usePresenceWebSocket } from '../../navigation/hooks/usePresenceWebSocket'
import { fetchStreamingSessions } from '../../../services/streamingStatusClient'
import { getLiveKitToken, RoomWithToken } from '../../../services/livekitClient'
import UserIndicator from '../../../components/UserIndicator'
import VideoCard from '../components/VideoCard'
import { useHeader } from '../../../context/HeaderContext'
import { useVideoActions } from '../hooks/UseVideoAction'

type RouteParams = { username?: string }

/**
 * Shows a single user’s live video stream if they’re online.
 *
 * - Fetches REST streaming flags via `usePresence`.
 * - Subscribes to live presence diffs via `usePresenceWebSocket`.
 * - When `shouldStream` becomes true, looks up the DB `userId` via
 *   `fetchStreamingSessions`, then requests a LiveKit token for that room
 *   via `getLiveKitToken(userId)`.
 * - Passes credentials into `<VideoCard>` so it can connect/play.
 */
const UserVideoPage: React.FC = () => {
  const { username } = useParams<RouteParams>()
  const displayName  = username ?? ''
  const { account }  = useAuth()
  const myEmail      = account?.username ?? ''

  // 1️⃣ REST snapshot of active streams
  const { streamingMap, loading, error } = usePresence()

  // 2️⃣ Listen for live presence diffs (merges into streamingMap)
  usePresenceWebSocket({
    currentEmail: myEmail,
    onPresence: () => {}, // no-op
  })

  // 3️⃣ Derive streaming flag for this user
  const shouldStream = Boolean(streamingMap[displayName])

  // 4️⃣ Local state for LiveKit credentials
  const [accessToken, setAccessToken] = useState<string>()
  const [roomName,    setRoomName]    = useState<string>()
  const [livekitUrl,  setLivekitUrl]  = useState<string>()
  const [loadingToken, setLoadingToken] = useState(false)

  // 5️⃣ When we should stream, fetch session ID + LiveKit token
  useEffect(() => {
    if (!shouldStream) {
      // cleanup on stop
      setAccessToken(undefined)
      setRoomName(undefined)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoadingToken(true)
      try {
        // a) find the DB session for this email
        const sessions = await fetchStreamingSessions()
        const sess = sessions.find(s => s.email === displayName)
        if (!sess) throw new Error('Streaming session not found')

        // b) ask backend for a token scoped to that room/userId
        const { rooms, livekitUrl } = await getLiveKitToken(sess.userId)
        const entry = rooms.find((r: RoomWithToken) => r.room === sess.userId)
        if (!entry) throw new Error('LiveKit token missing')

        if (!cancelled) {
          setRoomName(entry.room)
          setAccessToken(entry.token)
          setLivekitUrl(livekitUrl)
        }
      } catch (e) {
        console.error('[UserVideoPage] failed to fetch LiveKit token', e)
      } finally {
        if (!cancelled) setLoadingToken(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shouldStream, displayName])

  // 6️⃣ Header is updated only when title or stream status change
  const headerProps = useMemo(() => ({
    title: displayName,
    iconNode: (
      <UserIndicator
        user={{
          email:           displayName,
          name:            displayName,
          fullName:        displayName,
          status:          shouldStream ? 'online' : 'offline',
          azureAdObjectId: null,
        }}
        nameClass="text-white font-bold"
      />
    ),
  }), [displayName, shouldStream])
  useHeader(headerProps)

  // 7️⃣ Play/Stop/Chat actions
  const { handlePlay, handleStop, handleChat } = useVideoActions()

  if (loading) return <div className="p-6 text-white">Loading presence…</div>
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-20">
      <div className="flex-1 flex items-center justify-center">
        <VideoCard
          name         ={displayName}
          email        ={displayName}
          accessToken  ={accessToken}
          roomName     ={roomName}
          livekitUrl   ={livekitUrl}
          shouldStream ={shouldStream}
          connecting   ={loadingToken}
          onToggle     ={() =>
            shouldStream
              ? handleStop(displayName)
              : handlePlay(displayName)
          }
          onPlay       ={handlePlay}
          onStop       ={handleStop}
          onChat       ={handleChat}
          className    ="w-full h-full max-w-3xl"
          showHeader   ={false}
        />
      </div>
    </div>
  )
}

export default UserVideoPage
