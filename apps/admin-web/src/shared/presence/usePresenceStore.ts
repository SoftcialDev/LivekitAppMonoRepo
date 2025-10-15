// shared/presence/usePresenceStore.ts
import { create } from 'zustand';
import { fetchPresence } from '../api/presenceApi';
import { PresenceClient } from '../api/presenceClient';
import { WebPubSubClientService } from '../api/webpubsubClient';
import type { UserStatus } from '../types/UserStatus';

export interface PresenceState {
  onlineUsers: UserStatus[];
  offlineUsers: UserStatus[];
  loading: boolean;
  error: string | null;

  loadSnapshot(): Promise<void>;
  connectWebSocket(currentEmail: string): Promise<void>;
  disconnectWebSocket(): void;
}

export const usePresenceStore = create<PresenceState>((set, get) => {
  let svc: WebPubSubClientService | null = null;
  const presenceClient = new PresenceClient();

  return {
    onlineUsers: [],
    offlineUsers: [],
    loading: false,
    error: null,

    // REST snapshot (presence only)
    loadSnapshot: async (): Promise<void> => {
      set({ loading: true, error: null });
      try {
        const { online = [], offline = [] } = await fetchPresence();
        set({
          onlineUsers: online,
          offlineUsers: offline,
        });
      } catch (err: any) {
        set({
          error: err?.message ?? 'Unable to load presence',
          onlineUsers: [],
          offlineUsers: [],
        });
      } finally {
        set({ loading: false });
      }
    },

    // Real-time presence via Web PubSub
    connectWebSocket: async (currentEmail: string): Promise<void> => {
      svc = WebPubSubClientService.getInstance();

      // Ensure a clean socket before connecting
      await svc.forceCleanup().catch(() => {});
      await svc.connect(currentEmail);
      await svc.joinGroup('presence');

      // Mark current user as online (best-effort)
      await presenceClient.setOnline().catch(() => {});

        // Listen only to presence messages
        svc.onMessage<any>((msg) => {
          console.log('🔌 [usePresenceStore] WebSocket message received:', {
            type: msg?.type,
            hasUser: !!msg?.user,
            userEmail: msg?.user?.email,
            userRole: msg?.user?.role,
            userStatus: msg?.user?.status
          });

          if (msg?.type !== 'presence' || !msg?.user) {
            console.log('🔌 [usePresenceStore] Ignoring message (not presence or no user)');
            return;
          }
          
          const u = msg.user as UserStatus;
          const isOnline = u.status === 'online';
          console.log('🔌 [usePresenceStore] Processing presence update:', {
            email: u.email,
            role: u.role,
            status: u.status,
            isOnline
          });

        set((state) => {
          const wasOnline = state.onlineUsers.some((x) => x.email === u.email);
          const wasOffline = state.offlineUsers.some((x) => x.email === u.email);

          console.log('🔌 [usePresenceStore] Current state check:', {
            wasOnline,
            wasOffline,
            currentOnlineCount: state.onlineUsers.length,
            currentOfflineCount: state.offlineUsers.length
          });

          // No change → skip set()
          if ((isOnline && wasOnline) || (!isOnline && wasOffline)) {
            console.log('🔌 [usePresenceStore] No change needed, skipping update');
            return state;
          }

          const onlineUsers = isOnline
            ? wasOnline
              ? state.onlineUsers
              : [...state.onlineUsers, u]
            : state.onlineUsers.filter((x) => x.email !== u.email);

          const offlineUsers = !isOnline
            ? wasOffline
              ? state.offlineUsers
              : [...state.offlineUsers, u]
            : state.offlineUsers.filter((x) => x.email !== u.email);

          console.log('🔌 [usePresenceStore] State update:', {
            newOnlineCount: onlineUsers.length,
            newOfflineCount: offlineUsers.length,
            addedUser: isOnline ? u.email : null,
            removedUser: !isOnline ? u.email : null
          });

          return { onlineUsers, offlineUsers };
        });
      });
    },

    disconnectWebSocket: (): void => {
      // Best-effort mark offline & cleanup
      presenceClient.setOffline().catch(() => {});
      if (svc) {
        svc.forceCleanup().catch(() => {});
      }
      svc = null;
    },
  };
});
