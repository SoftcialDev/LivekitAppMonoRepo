import { useState, useEffect, useCallback } from 'react'
import type { UserStatus } from '../types/types'
import { fetchPresence } from '../services/presenceApi'

/**
 * Result returned by usePresence hook.
 */
interface UsePresenceResult {
  /** Array of users currently online */
  onlineUsers: UserStatus[]
  /** Array of users currently offline */
  offlineUsers: UserStatus[]
  /** True while fetching data */
  loading: boolean
  /** Error message if fetch failed, otherwise null */
  error: string | null
}

/**
 * Hook to fetch presence (online/offline users).
 *
 * Calls fetchPresence() once on mount. If polling is needed, uncomment interval logic.
 *
 * @param userEmail Optional email of current user; adjust fetchPresence if backend requires it.
 * @returns An object with onlineUsers, offlineUsers, loading, and error.
 */
export function usePresence(userEmail?: string): UsePresenceResult {
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([])
  const [offlineUsers, setOfflineUsers] = useState<UserStatus[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadPresence = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // If API needs userEmail, adjust fetchPresence signature accordingly:
      // const { online, offline } = await fetchPresence(userEmail)
      const { online, offline } = await fetchPresence()
      setOnlineUsers(online ?? [])
      setOfflineUsers(offline ?? [])
    } catch (err: any) {
      console.error('Error fetching presence', err)
      setError(err?.message ?? 'Error fetching presence')
      setOnlineUsers([])
      setOfflineUsers([])
    } finally {
      setLoading(false)
    }
  }, [userEmail])

  useEffect(() => {
    loadPresence()
    // For polling, uncomment:
    // const interval = setInterval(loadPresence, 10000)
    // return () => clearInterval(interval)
  }, [loadPresence])

  return { onlineUsers, offlineUsers, loading, error }
}
