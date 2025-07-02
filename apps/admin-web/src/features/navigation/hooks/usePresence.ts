import { useState, useEffect, useCallback, useRef } from "react"
import type { UserStatus } from "../types/types"
import { fetchPresence } from "../services/presenceApi"
import { fetchStreamingSessions } from "../../../services/streamingStatusClient"

export interface UsePresenceResult {
  /** Users who were online at last REST snapshot */
  onlineUsers: UserStatus[]
  /** Users who were offline at last REST snapshot */
  offlineUsers: UserStatus[]
  /** Map from user email → `true` if they have an active stream */
  streamingMap: Record<string, boolean>
  /** `true` while the initial load is in progress */
  loading: boolean
  /** Error message if the load failed, otherwise `null` */
  error: string | null
}

export interface UsePresenceOptions {
  /**
   * Called once after the initial REST snapshot completes successfully.
   *
   * @param online  Array of users who are online
   * @param offline Array of users who are offline
   */
  onLoaded?: (online: UserStatus[], offline: UserStatus[]) => void
}

/**
 * Custom hook that fetches the initial presence lists (online/offline)
 * and active streaming sessions exactly once on mount. Subsequent updates
 * should be driven by WebSocket events.
 *
 * @param opts Configuration options, including an `onLoaded` callback.
 * @returns Presence state and loading/error indicators.
 */
export function usePresence(
  opts: UsePresenceOptions = {}
): UsePresenceResult {
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([])
  const [offlineUsers, setOfflineUsers] = useState<UserStatus[]>([])
  const [streamingMap, setStreamingMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Keep the onLoaded callback in a ref so we don't re-run load on change
  const onLoadedRef = useRef(opts.onLoaded)
  onLoadedRef.current = opts.onLoaded

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1️⃣ Fetch presence snapshot
      const { online = [], offline = [] } = await fetchPresence()

      // 2️⃣ Fetch active streaming sessions
      const sessions = await fetchStreamingSessions()
      const map: Record<string, boolean> = {}
      sessions.forEach(s => {
        map[s.email] = true
      })

      // 3️⃣ Update state
      setOnlineUsers(online)
      setOfflineUsers(offline)
      setStreamingMap(map)

      // 4️⃣ Notify consumer
      onLoadedRef.current?.(online, offline)
    } catch (err: any) {
      console.error("Error loading presence/streaming", err)
      setError(err.message ?? "Failed to load presence")
      // Clear any stale data
      setOnlineUsers([])
      setOfflineUsers([])
      setStreamingMap({})
    } finally {
      setLoading(false)
    }
  }, [])

  // Run only once on mount
  useEffect(() => {
    loadAll()
  }, [loadAll])

  return { onlineUsers, offlineUsers, streamingMap, loading, error }
}
