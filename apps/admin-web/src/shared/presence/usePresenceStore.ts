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
  connectWebSocket(currentEmail: string, currentRole?: string): Promise<void>;
  disconnectWebSocket(): void;
}

export const usePresenceStore = create<PresenceState>((set, get) => {
  let svc: WebPubSubClientService | null = null;
  let messageHandlerRegistered = false;
  let isConnecting = false;
  const presenceClient = new PresenceClient();

  /**
   * Handles supervisor change notifications from WebSocket
   * @param msg - The supervisor change notification message
   */
  const handleSupervisorChangeNotification = (msg: any) => {
    const { data } = msg;
    if (!data) return;

    const { psoEmails, oldSupervisorEmail, newSupervisorEmail, newSupervisorId, psoNames, newSupervisorName } = data;
    
    // Get current user info from localStorage or context
    const currentEmail = localStorage.getItem('currentEmail') || '';
    const currentRole = localStorage.getItem('userRole') || '';
    
    console.log(`🔄 [usePresenceStore] Processing notification for user: ${currentEmail} (${currentRole})`);
    console.log(`🔄 [usePresenceStore] Notification data:`, { psoEmails, oldSupervisorEmail, newSupervisorEmail, psoNames, newSupervisorName });
    
    // Determine if this user should refresh their data
    // Always refresh for Admin/SuperAdmin, and for any Supervisor (they need to see updated PSO assignments)
    const shouldRefresh = 
      currentRole === 'Admin' || 
      currentRole === 'SuperAdmin' ||
      currentRole === 'Supervisor' ||
      currentEmail === oldSupervisorEmail ||
      currentEmail === newSupervisorEmail;
      
    console.log(`🔄 [usePresenceStore] Should refresh: ${shouldRefresh} (role: ${currentRole}, email: ${currentEmail})`);
      
    if (shouldRefresh) {
      // Update supervisor information in the presence store
      set((state) => {
        const updatedOnlineUsers = state.onlineUsers.map(user => {
          // Update PSOs that were transferred
          if (psoEmails.includes(user.email)) {
            return {
              ...user,
              supervisorEmail: newSupervisorEmail,
              supervisorId: newSupervisorId,
              supervisorName: newSupervisorName
            };
          }
          return user;
        });

        const updatedOfflineUsers = state.offlineUsers.map(user => {
          // Update PSOs that were transferred
          if (psoEmails.includes(user.email)) {
            return {
              ...user,
              supervisorEmail: newSupervisorEmail,
              supervisorId: newSupervisorId,
              supervisorName: newSupervisorName
            };
          }
          return user;
        });

        return {
          onlineUsers: updatedOnlineUsers,
          offlineUsers: updatedOfflineUsers
        };
      });

      // Trigger a custom event that components can listen to
      const event = new CustomEvent('supervisorChange', {
        detail: {
          psoEmails,
          oldSupervisorEmail,
          newSupervisorEmail,
          newSupervisorId,
          psoNames,
          newSupervisorName
        }
      });
      
      console.log(`🔄 [usePresenceStore] Dispatching supervisorChange event:`, event.detail);
      window.dispatchEvent(event);
      
      console.log(`🔄 [usePresenceStore] Supervisor change detected and updated: ${psoNames.join(', ')} transferred to ${newSupervisorName}`);
    }
  };

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
    connectWebSocket: async (currentEmail: string, currentRole?: string): Promise<void> => {
      // Prevent duplicate connections
      if (isConnecting) {
        console.log('🔌 [usePresenceStore] Connection already in progress, skipping...');
        return;
      }

      if (svc && svc.isConnected && svc.isConnected()) {
        console.log('🔌 [usePresenceStore] Already connected, skipping...');
        return;
      }

      try {
        isConnecting = true;
        
        // Save user info to localStorage for supervisor change notifications
        if (currentEmail) {
          localStorage.setItem('currentEmail', currentEmail);
        }
        if (currentRole) {
          localStorage.setItem('userRole', currentRole);
        }
        
        console.log(`🔌 [usePresenceStore] Saved user info: ${currentEmail} (${currentRole})`);
        
        svc = WebPubSubClientService.getInstance();
        
        if (!svc) {
          console.error('❌ [usePresenceStore] WebPubSubClientService instance is null');
          return;
        }

        console.log('🔌 [usePresenceStore] Connecting to WebSocket...');

        // Ensure a clean socket before connecting
        await svc.forceCleanup().catch(() => {});
        
        // Set up message handler BEFORE connecting (only once)
        if (!messageHandlerRegistered) {
          svc.onMessage<any>((msg) => {
            console.log(`📡 [usePresenceStore] WebSocket message received:`, msg);
            
            // Handle supervisor change notifications
            if (msg?.type === 'supervisor_change_notification') {
              console.log(`🔄 [usePresenceStore] Processing supervisor change notification:`, msg);
              handleSupervisorChangeNotification(msg);
              return;
            }
          
          // Handle presence messages
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
      
          // Mark handler as registered to prevent duplicates
          messageHandlerRegistered = true;
        }

        // Now connect to WebSocket
        await svc.connect(currentEmail);
        await svc.joinGroup('presence');

        console.log('✅ [usePresenceStore] WebSocket connected and joined presence group');

        // Mark current user as online (best-effort)
        await presenceClient.setOnline().catch(() => {});

      } catch (error) {
        console.error('❌ [usePresenceStore] Failed to connect WebSocket:', error);
        svc = null;
      } finally {
        isConnecting = false;
      }
    },

    disconnectWebSocket: (): void => {
      // Best-effort mark offline & cleanup
      presenceClient.setOffline().catch(() => {});
      if (svc) {
        svc.forceCleanup().catch(() => {});
      }
      svc = null;
      isConnecting = false;
      messageHandlerRegistered = false;
    },
  };
});
