import React, { useEffect, useState } from 'react'
import { useHeader } from '../../../context/HeaderContext'
import monitorIcon from '@assets/monitor-icon.png'
import { useAuth } from '../../auth/hooks/useAuth'
import type { UserStatus } from 'src/features/navigation/types/types'
import VideoCard from '../components/VideoCard'
import { useVideoActions } from '../hooks/UseVideoAction'
import { getLiveKitToken, RoomWithToken } from '../services/livekitClient'
import { usePresence } from '../../navigation/hooks/usePresence'
import { fetchStreamingSessions } from '@/services/streamingStatusClient'

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

interface StreamingSessionDto {
  email:     string
  startedAt: string
  userId:    string
}

export interface PSOWithStatus extends UserStatus {
  fullName:      string
  isOnline:      boolean
  liveKitToken?: string
  liveKitRoom?:  string
  liveKitUrl?:   string
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' })
  const { initialized, account } = useAuth()
  const { handlePlay, handleStop, handleChat } = useVideoActions()
  const { onlineUsers, offlineUsers } = usePresence()
   const [playState, setPlayState] = useState<Record<string, boolean>>({})
  const [psos, setPsos]       = useState<PSOWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string>()
  const [connecting, setConnecting] = useState<Record<string, boolean>>({})
  // ← añadido: control en caliente de Play/Stop
  const [requested, setRequested] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!initialized || !account) return
    let canceled = false

    const loadData = async () => {
      setLoading(true)
      setError(undefined)

      try {
        // 1) Combine presence lists
        const combined: PSOWithStatus[] = [
          ...onlineUsers,
          ...offlineUsers,
        ].map(u => ({
          ...u,
          fullName: u.fullName ?? u.name ?? '',
          isOnline: u.status === 'online',
        }))

        // 2) Fetch active sessions (with DB PK userId)
        const sessions: StreamingSessionDto[] = await fetchStreamingSessions()
        const sessionMap: Record<string,string> = {}
        sessions.forEach(s => {
          sessionMap[s.email] = s.userId
        })
        const streamingIds = Object.values(sessionMap)

        // 3) Fetch LiveKit tokens once
        let tokenMap: Record<string,string> = {}
        let livekitUrl = ''
        if (streamingIds.length > 0) {
          const { rooms, livekitUrl: url } = await getLiveKitToken()
          livekitUrl = url
          ;(rooms as RoomWithToken[]).forEach(r => {
            if (streamingIds.includes(r.room)) {
              tokenMap[r.room] = r.token
            }
          })
        }

        // 4) Enrich each PSO with token & URL if available
        const enriched = combined.map(u => {
          const id = sessionMap[u.email]
          const token = id ? tokenMap[id] : undefined
          return {
            ...u,
            liveKitRoom:  id,
            liveKitToken: token,
            liveKitUrl:   token ? livekitUrl : undefined,
          }
        })

        // 5) Sort online-first
        enriched.sort((a, b) => Number(b.isOnline) - Number(a.isOnline))

        if (!canceled) {
          setPsos(enriched)
          // inicializar requested para quienes ya tenían token
          setRequested(prev => {
            const next = { ...prev }
            enriched.forEach(p => {
              if (!(p.email in next)) {
                next[p.email] = Boolean(p.liveKitToken)
              }
            })
            return next
          })
        }
      } catch (e: any) {
        console.error('[PSOsPage] loadData error', e)
        if (!canceled) setError(e.message || 'Failed to load PSOs')
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadData()
    return () => { canceled = true }
  }, [initialized, account, onlineUsers, offlineUsers])

  if (loading) return <div className="p-6 text-white">Loading PSOs…</div>
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>
  if (psos.length === 0)
    return <div className="p-6 text-white">No PSOs to display</div>

  const count = psos.length


  

  // ← añadido: toggle que refresca token y marca shouldStream
const handleToggle = (email: string) => {
  const isOn   = requested[email]   ?? false
  const isConn = connecting[email]  ?? false

  // Si ya está on o en connecting → STOP
  if (isOn || isConn) {
    handleStop(email)
    setPsos(prev =>
      prev.map(u =>
        u.email === email
          ? { ...u, liveKitRoom: undefined, liveKitToken: undefined, liveKitUrl: undefined }
          : u
      )
    )
    setRequested(prev  => ({ ...prev,  [email]: false }))
    setConnecting(prev => ({ ...prev,  [email]: false }))
    return
  }

  // START
  handlePlay(email)
  setConnecting(prev => ({ ...prev, [email]: true }))

  const doFetch = async (isRetry: boolean) => {
    try {
      const sessions = await fetchStreamingSessions()
      const sess     = sessions.find(s => s.email === email)
      if (!sess) throw new Error('session not found')

      const { rooms, livekitUrl: lkUrl } = await getLiveKitToken()
      const entry = (rooms as RoomWithToken[]).find(r => r.room === sess.userId)
      if (!entry) throw new Error('token not returned')

      setPsos(prev =>
        prev.map(u =>
          u.email === email
            ? {
                ...u,
                liveKitRoom:  sess.userId,
                liveKitToken: entry.token,
                liveKitUrl:   lkUrl,
              }
            : u
        )
      )
      setRequested(prev  => ({ ...prev,  [email]: true }))
      setConnecting(prev => ({ ...prev,  [email]: false }))
    } catch (err) {
      console.error(`[PSOsPage] token fetch ${isRetry ? 'retry ' : ''}failed for`, email, err)
      if (!isRetry) {
        // schedule retry único a los 10s totales (7s después del primer intento)
        setTimeout(() => void doFetch(true), 7000)
      } else {
        // tras segundo fallo, liberamos el botón
        setConnecting(prev => ({ ...prev, [email]: false }))
      }
    }
  }

  // primer intento a los 3s
  setTimeout(() => void doFetch(false), 3000)
}

  return (
    <div className="flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
      {/* 1 PSO */}
      {count === 1 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-grow items-center justify-center p-4">
            <div className="w-11/12 h-full">
              <VideoCard
                name         ={psos[0].fullName}
                email        ={psos[0].email}
                accessToken  ={psos[0].liveKitToken}
                roomName     ={psos[0].liveKitRoom}
                livekitUrl   ={psos[0].liveKitUrl}
                shouldStream ={requested[psos[0].email]}
                onToggle     ={handleToggle}
                connecting   ={connecting[psos[0].email] ?? false} 
                onPlay       ={handlePlay}
                onStop       ={handleStop}
                onChat       ={handleChat}
                className    ="w-full h-full"
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
            gridTemplateRows:    '1fr',
            height:              '-webkit-fill-available',
          }}
        >
          {psos.map(u => (
            <div key={u.email} className="w-full h-full">
              <VideoCard
                name         ={u.fullName}
                email        ={u.email}
                accessToken  ={u.liveKitToken}
                roomName     ={u.liveKitRoom}
                livekitUrl   ={u.liveKitUrl}
                shouldStream ={requested[u.email]}
                onToggle     ={handleToggle}
                connecting   ={connecting[u.email] ?? false} 
                onPlay       ={handlePlay}
                onStop       ={handleStop}
                onChat       ={handleChat}
                className    ="w-full h-full"
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
                  name         ={u.fullName}
                  email        ={u.email}
                  accessToken  ={u.liveKitToken}
                  roomName     ={u.liveKitRoom}
                  livekitUrl   ={u.liveKitUrl}
                  shouldStream ={requested[u.email]}
                  onToggle     ={handleToggle}
                  onPlay       ={handlePlay}
                  connecting   ={connecting[u.email] ?? false} 
                  onStop       ={handleStop}
                  onChat       ={handleChat}
                  className    ="flex-1"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-1 justify-center mt-2 min-h-0">
            <div className="w-1/2 flex flex-col h-full">
              <VideoCard
                name         ={psos[2].fullName}
                email        ={psos[2].email}
                accessToken  ={psos[2].liveKitToken}
                roomName     ={psos[2].liveKitRoom}
                livekitUrl   ={psos[2].liveKitUrl}
                shouldStream ={requested[psos[2].email]}
                onToggle     ={handleToggle}
                onPlay       ={handlePlay}
                onStop       ={handleStop}
                connecting   ={connecting[psos[2].email] ?? false}
                onChat       ={handleChat}
                className    ="flex-1"
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
            gridTemplateRows:    'repeat(2, 1fr)',
          }}
        >
          {psos.map(u => (
            <div key={u.email} className="w-full h-full">
              <VideoCard
                name         ={u.fullName}
                email        ={u.email}
                accessToken  ={u.liveKitToken}
                roomName     ={u.liveKitRoom}
                livekitUrl   ={u.liveKitUrl}
                shouldStream ={requested[u.email]}
                onToggle     ={handleToggle}
                onPlay       ={handlePlay}
                connecting   ={connecting[u.email] ?? false} 
                onStop       ={handleStop}
                onChat       ={handleChat}
                className    ="w-full h-full"
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
            gridAutoRows:        '1fr',
          }}
        >
          {psos.map((u, i) => {
            const rows        = Math.ceil(count / 3)
            const rowIndex    = Math.floor(i / 3)
            const inLastRow   = rowIndex === rows - 1
            const itemsInLast = count - 3 * (rows - 1)
            const alignClass  = inLastRow && itemsInLast < 3
              ? 'justify-self-center'
              : 'justify-self-stretch'

            return (
              <div key={u.email} className={`w-full h-full ${alignClass}`}>
                <VideoCard
                  name         ={u.fullName}
                  email        ={u.email}
                  accessToken  ={u.liveKitToken}
                  roomName     ={u.liveKitRoom}
                  livekitUrl   ={u.liveKitUrl}
                  shouldStream ={requested[u.email]}
                  onToggle     ={handleToggle}
                  onPlay       ={handlePlay}
                  connecting   ={connecting[u.email] ?? false} 
                  onStop       ={handleStop}
                  onChat       ={handleChat}
                  className    ="w-full h-full"
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
