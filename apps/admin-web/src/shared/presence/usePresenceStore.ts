import { create } from 'zustand'
import { fetchPresence } from '../api/presenceApi'
import { PresenceClient } from '../api/presenceClient'
import { fetchStreamingSessions } from '../api/streamingStatusClient'
import { WebPubSubClientService } from '../api/webpubsubClient'
import { UserStatus } from '../types/UserStatus'


/**
 * Defines the shape of our presence store:
 * - onlineUsers: users currently online
 * - offlineUsers: users currently offline
 * - streamingMap: map of active streams by email
 * - loading/error flags
 * - actions for REST snapshot and real-time updates
 */
export interface PresenceState {
  /** Users detected as online in the last REST snapshot */
  onlineUsers: UserStatus[]
  /** Users detected as offline in the last REST snapshot */
  offlineUsers: UserStatus[]
  /** Map: email → true if the user has an active stream */
  streamingMap: Record<string, boolean>
  /** True while the REST snapshot is being fetched */
  loading: boolean
  /** Error message if snapshot fails, otherwise null */
  error: string | null

  /**
   * Fetches a one-time snapshot of presence and streaming activity via REST.
   *
   * Updates `onlineUsers`, `offlineUsers`, and `streamingMap`.
   *
   * @returns Promise<void> resolving when the snapshot is complete.
   */
  loadSnapshot(): Promise<void>

  /**
   * Opens a Web PubSub connection for real-time presence.
   * Marks the user as online via REST and joins the "presence" group.
   *
   * @param currentEmail - The logged-in user’s email used for grouping
   * @returns Promise<void> resolving when connection and subscription are ready.
   */
  connectWebSocket(currentEmail: string): Promise<void>

  /**
   * Closes the Web PubSub connection gracefully.
   * Marks the user as offline via REST and stops listening for events.
   *
   * @returns void
   */
  disconnectWebSocket(): void
}

/**
 * Creates a global presence store using Zustand.
 * Combines:
 *  1) A REST snapshot loader,
 *  2) A real-time WebSocket subscription,
 *  3) State slices for UI consumption.
 */
export const usePresenceStore = create<PresenceState>((set, get) => {
  let svc: WebPubSubClientService | null = null
  const presenceClient = new PresenceClient()

  return {
    onlineUsers: [],
    offlineUsers: [],
    streamingMap: {},
    loading: false,
    error: null,

    loadSnapshot: async (): Promise<void> => {
      set({ loading: true, error: null })
      try {
        const { online = [], offline = [] } = await fetchPresence()
        
        const sessions = await fetchStreamingSessions()
        
        const map: Record<string, boolean> = {}
        ;(sessions as { email: string }[]).forEach(s => {
          map[s.email] = true
        })


        set({
          onlineUsers: online,
          offlineUsers: offline,
          streamingMap: map
        })
      } catch (err: any) {
        set({
          error: err.message ?? 'Unable to load presence',
          onlineUsers: [],
          offlineUsers: [],
          streamingMap: {}
        })
      } finally {
        set({ loading: false })
      }
    },

    connectWebSocket: async (currentEmail: string): Promise<void> => {
      
      // ✅ USAR SINGLETON - Evitar múltiples instancias
      svc = WebPubSubClientService.getInstance()
      
      // ✅ FORCE CLEANUP - Limpiar conexiones existentes antes de conectar
      await svc.forceCleanup()
      
      await svc.connect(currentEmail)
      
      await svc.joinGroup('presence')
      
      await presenceClient.setOnline()

      svc.onMessage<any>(msg => {
        if (msg.type !== 'presence') return
        const u = msg.user as UserStatus

        set((state: PresenceState) => {
          // Only update if there's an actual change
          const isOnline = u.status === 'online'
          const wasOnline = state.onlineUsers.some(x => x.email === u.email)
          const wasOffline = state.offlineUsers.some(x => x.email === u.email)
          
          // Skip update if no change in status
          if ((isOnline && wasOnline) || (!isOnline && wasOffline)) {
            return state
          }

          const onlineUsers = isOnline
            ? wasOnline 
              ? state.onlineUsers 
              : [...state.onlineUsers, u]
            : state.onlineUsers.filter(x => x.email !== u.email)

          const offlineUsers = !isOnline
            ? wasOffline
              ? state.offlineUsers
              : [...state.offlineUsers, u]
            : state.offlineUsers.filter(x => x.email !== u.email)

          return { onlineUsers, offlineUsers }
        })
      })
    },

    disconnectWebSocket: (): void => {
      presenceClient.setOffline().catch(err => {
        // Failed to mark offline - silently continue
      })
      
      // ✅ FORCE CLEANUP - Limpiar todas las conexiones al desconectar
      if (svc) {
        svc.forceCleanup().catch(err => {
          // Failed to force cleanup - silently continue
        })
      }
      
      svc = null
    }
  }
})
