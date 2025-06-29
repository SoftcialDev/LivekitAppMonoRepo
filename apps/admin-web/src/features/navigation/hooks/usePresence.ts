
import { useState, useEffect, useCallback } from 'react'
import type { UserStatus } from '../types/types'
import { fetchPresence } from '../services/presenceApi'
import { fetchStreamingSessions } from '../../../services/streamingStatusClient'

/**
 * Result returned by usePresence hook.
 */
export interface UsePresenceResult {
  /** Array of users currently online */
  onlineUsers: UserStatus[]
  /** Array of users currently offline */
  offlineUsers: UserStatus[]
  /** Map from userEmail → true if actively streaming */
  streamingMap: Record<string, boolean>
  /** True while fetching data */
  loading: boolean
  /** Error message if fetch failed, otherwise null */
  error: string | null
}

/**
 * Hook to fetch presence (online/offline users) and active streaming sessions.
 *
 * Calls fetchPresence() and fetchStreamingSessions() once on mount.
 */
export function usePresence(): UsePresenceResult {
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([])
  const [offlineUsers, setOfflineUsers] = useState<UserStatus[]>([])
  const [streamingMap, setStreamingMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1) Fetch presence lists
      
const { online = [], offline = [] } = await fetchPresence()
      // 2) Fetch active streaming sessions (returns e.g. [{ email: string, startedAt: string, ... }, ...])
      const sessions = await fetchStreamingSessions()

      // Build a map: email → true if there's an open session
      const map: Record<string, boolean> = {}
      for (const s of sessions) {
        map[s.email] = true
      }

      setOnlineUsers(online)
      setOfflineUsers(offline)
      setStreamingMap(map)
    } catch (err: any) {
      console.error('Error loading presence/streaming', err)
      setError(err.message ?? 'Failed to load presence')
      setOnlineUsers([])
      setOfflineUsers([])
      setStreamingMap({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    // If you need polling, uncomment next lines:
    // const interval = setInterval(loadAll, 15000)
    // return () => clearInterval(interval)
  }, [loadAll])

  return { onlineUsers, offlineUsers, streamingMap, loading, error }
}
