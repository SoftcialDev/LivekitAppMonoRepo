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
          if (msg?.type !== 'presence' || !msg?.user) {
            return;
          }
          
          const u = msg.user as UserStatus;
          const isOnline = u.status === 'online';

        set((state) => {
          const wasOnline = state.onlineUsers.some((x) => x.email === u.email);
          const wasOffline = state.offlineUsers.some((x) => x.email === u.email);

          // No change → skip set()
          if ((isOnline && wasOnline) || (!isOnline && wasOffline)) {
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
