import React, { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { usePresence } from '../../navigation/hooks/usePresence'
import { usePresenceWebSocket } from '../../navigation/hooks/usePresenceWebSocket'
import UserIndicator from '../../../components/UserIndicator'
import VideoCard from '../components/VideoCard'
import { useHeader } from '../../../context/HeaderContext'
import { useVideoActions } from '../hooks/UseVideoAction'
import type { UserStatus } from '../../navigation/types/types'

type RouteParams = { username?: string }

/**
 * Shows a single user’s live video stream if they’re online.
 *
 * - Fetches REST streaming flags via `usePresence`.
 * - Subscribes to live presence diffs via `usePresenceWebSocket`.
 * - Derives `shouldStream` from `streamingMap[displayName]`.
 * - Updates the page header only when title or status actually change.
 */
const UserVideoPage: React.FC = () => {
  const { username } = useParams<RouteParams>()
  const displayName  = username ?? ''
  const { account }  = useAuth()
  const myEmail      = account?.username ?? ''

  // 1️⃣ REST snapshot of active streams
  const { streamingMap, loading, error } = usePresence()

  // 2️⃣ Listen for live presence diffs (internally merges into streamingMap)
  usePresenceWebSocket({
    currentEmail: myEmail,
    onPresence: () => { /* no-op: usePresenceWebSocket updates streamingMap */ },
  })

  // derive whether we should be streaming right now
  const shouldStream = Boolean(streamingMap[displayName])

  // 3️⃣ Prepare stable header props
  const headerProps = useMemo(() => ({
    title: displayName,
    iconNode: (
      <UserIndicator
        user={{
          email:            displayName,
          name:             displayName,
          fullName:         displayName,
          status:           shouldStream ? 'online' : 'offline',
          azureAdObjectId:  null,
        }}
        nameClass="text-white font-bold"
      />
    ),
  }), [displayName, shouldStream])

  // 4️⃣ Apply header props via hook
  useHeader(headerProps)

  // 5️⃣ Video control hooks
  const { handlePlay, handleStop, handleChat } = useVideoActions()

  if (loading) return <div className="p-6 text-white">Loading presence…</div>
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-20">
      <div className="flex-1 flex items-center justify-center">
        <VideoCard
          name         ={displayName}
          email        ={displayName}
          accessToken  ={undefined}
          roomName     ={undefined}
          livekitUrl   ={undefined}
          shouldStream ={shouldStream}
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
          connecting   ={false}
        />
      </div>
    </div>
  )
}

export default UserVideoPage
