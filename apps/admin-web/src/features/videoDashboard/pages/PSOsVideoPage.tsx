import React, { useEffect, useState } from 'react'
import { useHeader } from '../../../context/HeaderContext'
import monitorIcon from '@assets/monitor-icon.png'
import { useAuth } from '../../auth/hooks/useAuth'
import type { UserStatus } from 'src/features/navigation/types/types'
import VideoCard from '../components/VideoCard'
import { useVideoActions } from '../hooks/UseVideoAction'
import { getLiveKitToken, RoomWithToken } from '../services/livekitClient'
import apiClient from '../../../services/apiClient'

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export interface PSOWithStatus extends UserStatus {
  fullName: string
  isOnline: boolean
  liveKitToken?: string
  liveKitRoom?: string
  liveKitUrl?: string
  azureAdObjectId: string
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' })
  const { initialized, account } = useAuth()
  const { handlePlay, handleStop, handleChat } = useVideoActions()

  const [psos, setPsos]       = useState<PSOWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string>()

  useEffect(() => {
    if (!initialized || !account) return
    let canceled = false

    const loadData = async () => {
      setLoading(true)
      try {
        // 1) Fetch presence (includes azureAdObjectId)
        const resp = await apiClient.get<{
          items: (UserStatus & { azureAdObjectId: string })[]
        }>('/api/GetPresenceStatus')

        // 2) Fetch per-room tokens + URL
        const { rooms, livekitUrl } = await getLiveKitToken()
        if (canceled) return

        // 3) Build enriched list
        const list: PSOWithStatus[] = resp.data.items.map(u => {
          const isOnline = u.status === 'online'
          const roomName = u.azureAdObjectId
          const match    = rooms.find((r: RoomWithToken) => r.room === roomName)
          const token    = isOnline && match
            ? match.token
            : undefined

          return {
            ...u,
            fullName:     u.fullName ?? u.name ?? '',
            isOnline,
            liveKitRoom:  roomName,
            liveKitToken: token,
            liveKitUrl:   token ? livekitUrl : undefined,
          }
        })

        // 4) Sort online-first
        list.sort((a, b) => Number(b.isOnline) - Number(a.isOnline))

        if (!canceled) setPsos(list)
      } catch (e: any) {
        if (!canceled) setError(e.message || 'Failed to load PSOs')
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadData()
    return () => { canceled = true }
  }, [initialized, account])

  if (loading) return <div className="p-6 text-white">Loading PSOs…</div>
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>
  if (psos.length === 0)
    return <div className="p-6 text-white">No PSOs to display</div>

  const count = psos.length

  return (
    <div className="flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
      {/* 1 PSO */}
      {count === 1 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-grow items-center justify-center p-4">
            <div className="w-11/12 h-full">
              <VideoCard
                name={psos[0].fullName}
                email={psos[0].email}
                accessToken={psos[0].liveKitToken}
                roomName={psos[0].liveKitRoom}
                livekitUrl={psos[0].liveKitUrl}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2 PSOs */}
      {count === 2 && (
        <div
          className="grid flex-grow gap-4"
          style={{
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: '1fr',
            height: '-webkit-fill-available',
          }}
        >
          {psos.map(u => (
            <div key={u.email} className="w-full h-full">
              <VideoCard
                name={u.fullName}
                email={u.email}
                accessToken={u.liveKitToken}
                roomName={u.liveKitRoom}
                livekitUrl={u.liveKitUrl}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 3 PSOs */}
      {count === 3 && (
        <div className="flex flex-col flex-1 min-h-0 p-2">
          <div className="flex flex-1 gap-2 min-h-0">
            {psos.slice(0, 2).map(u => (
              <div key={u.email} className="w-1/2 flex flex-col h-full">
                <VideoCard
                  name={u.fullName}
                  email={u.email}
                  accessToken={u.liveKitToken}
                  roomName={u.liveKitRoom}
                  livekitUrl={u.liveKitUrl}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  onChat={handleChat}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-1 justify-center mt-2 min-h-0">
            <div className="w-1/2 flex flex-col h-full">
              <VideoCard
                name={psos[2].fullName}
                email={psos[2].email}
                accessToken={psos[2].liveKitToken}
                roomName={psos[2].liveKitRoom}
                livekitUrl={psos[2].liveKitUrl}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4 PSOs */}
      {count === 4 && (
        <div
          className="grid flex-grow gap-4 justify-center content-center"
          style={{
            gridTemplateColumns: 'repeat(2, 0.4fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
          }}
        >
          {psos.map(u => (
            <div key={u.email} className="w-full h-full">
              <VideoCard
                name={u.fullName}
                email={u.email}
                accessToken={u.liveKitToken}
                roomName={u.liveKitRoom}
                livekitUrl={u.liveKitUrl}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 5+ PSOs */}
      {count >= 5 && (
        <div
          className="grid flex-grow gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '1fr',
          }}
        >
          {psos.map((u, i) => {
            const rows       = Math.ceil(count / 3)
            const rowIndex   = Math.floor(i / 3)
            const inLastRow  = rowIndex === rows - 1
            const itemsInLast = count - 3 * (rows - 1)
            const alignClass =
              inLastRow && itemsInLast < 3
                ? 'justify-self-center'
                : 'justify-self-stretch'

            return (
              <div key={u.email} className={`w-full h-full ${alignClass}`}>
                <VideoCard
                  name={u.fullName}
                  email={u.email}
                  accessToken={u.liveKitToken}
                  roomName={u.liveKitRoom}
                  livekitUrl={u.liveKitUrl}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  onChat={handleChat}
                  className="w-full h-full"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PSOsPage
