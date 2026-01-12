/**
 * @fileoverview Presence store - Zustand store for user presence
 * @summary Manages online/offline user status via WebSocket
 * @description Store for managing user presence state with real-time WebSocket updates
 * 
 * This store ONLY handles presence (online/offline). Supervisor-related logic
 * is handled by the supervisor module and delegates updates via updateSupervisorInfo().
 */

import { create } from 'zustand';
import { fetchPresence } from '../../api/presenceApi';
import { PresenceClient } from '../../api/presenceClient';
import { webSocketService } from '@/shared/services/webSocket/index';
import { logInfo, logError, logDebug, logWarn } from '@/shared/utils/logger';
import { PresenceSnapshotError, PresenceConnectionError } from '../../errors';
import { PresenceStatus } from '../../enums/presenceEnums';
import { PRESENCE_MAX_INITIAL_USERS } from '../../constants/presenceConstants';
import { WEBSOCKET_GROUPS } from '@/shared/services/webSocket/constants/webSocketConstants';
import { UnauthorizedError, RequestTimeoutError } from '@/shared/errors';
import { isTokenAvailable } from '@/shared/api/apiClient';
import type { IPresenceState } from './types/presenceStoreTypes';
import type { UserStatus, SupervisorInfoUpdate } from '../../types/presenceTypes';

/**
 * Maximum number of retry attempts for 401 errors
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Maximum number of retry attempts for timeout errors
 * Total time: ~2 minutes (90s timeout + retries with backoff)
 */
const MAX_TIMEOUT_RETRY_ATTEMPTS = 4;

/**
 * Initial delay in milliseconds before first retry (500ms)
 */
const INITIAL_RETRY_DELAY_MS = 500;

/**
 * Maximum delay in milliseconds between retries (2 seconds)
 */
const MAX_RETRY_DELAY_MS = 2000;

/**
 * Maximum total time to spend retrying in milliseconds (2 minutes)
 */
const MAX_TOTAL_RETRY_TIME_MS = 120000;

export const usePresenceStore = create<IPresenceState>((set, get) => {
  let isConnecting = false;
  let hasLoadedSnapshot = false; // Global flag to prevent multiple loads
  let isLoadingSnapshot = false; // Prevent concurrent loads
  const presenceClient = new PresenceClient();

  return {
    onlineUsers: [],
    offlineUsers: [],
    loading: false,
    error: null,

    /**
     * Loads initial presence snapshot from REST API with retry logic for 401 errors
     * 
     * **Performance optimization**: By default, loads all users (online + offline).
     * The sidebar needs to show all users, with offline users marked as offline.
     * 
     * This should be called once on mount to get the initial state.
     * Subsequent updates come via WebSocket in real-time.
     * 
     * **Important**: This method is idempotent - it will only load once per session.
     * If data already exists or a load is in progress, it will return immediately.
     * 
     * **Retry logic**: Implements exponential backoff retry for 401 Unauthorized errors
     * (up to 3 attempts) to handle cases where the token may not be immediately available.
     * 
     * @param options - Optional configuration for fetching presence
     */
    loadSnapshot: async (options?: { onlyOnline?: boolean }): Promise<void> => {
      // Prevent multiple loads - if already loaded or loading, return immediately
      if (hasLoadedSnapshot || isLoadingSnapshot) {
        logDebug('Presence snapshot already loaded or loading, skipping', {
          hasLoadedSnapshot,
          isLoadingSnapshot,
        });
        return;
      }

      isLoadingSnapshot = true;
      set({ loading: true, error: null });

      // Track start time for total retry time limit
      const startTime = Date.now();

      // Internal retry function with exponential backoff
      const attemptLoad = async (attempt: number = 0): Promise<void> => {
        try {
          // Wait for token to be available before attempting fetch
          // This prevents 401 errors on page refresh
          if (attempt === 0) {
            let retries = 0;
            const maxTokenWaitAttempts = 5;
            while (!(await isTokenAvailable()) && retries < maxTokenWaitAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 200));
              retries++;
            }
            if (!(await isTokenAvailable())) {
              logWarn('Token not available after waiting, proceeding with fetch', {});
            }
          }

          // Load all users (online + offline) by default
          // The sidebar needs to show all users, with offline users marked as offline
          // WebSocket will update statuses in real-time as users come online/offline
          const { online = [], offline = [] } = await fetchPresence({
            onlyOnline: options?.onlyOnline ?? false,
            maxUsers: PRESENCE_MAX_INITIAL_USERS,
          });

          set({
            onlineUsers: online,
            offlineUsers: offline,
            loading: false,
            error: null, // Clear any previous errors on success
          });

          hasLoadedSnapshot = true; // Mark as loaded
          isLoadingSnapshot = false;

          logInfo('Presence snapshot loaded', {
            onlineCount: online.length,
            offlineCount: offline.length,
            onlyOnline: options?.onlyOnline ?? false,
            attempt: attempt + 1,
          });
        } catch (err) {
          const elapsedTime = Date.now() - startTime;
          const isTimeout = err instanceof RequestTimeoutError ||
            (err instanceof PresenceSnapshotError && err.cause instanceof RequestTimeoutError);
          const isUnauthorized = err instanceof UnauthorizedError || 
            (err instanceof PresenceSnapshotError && err.cause instanceof UnauthorizedError);

          // Check if we should retry timeout errors
          if (isTimeout && attempt < MAX_TIMEOUT_RETRY_ATTEMPTS && elapsedTime < MAX_TOTAL_RETRY_TIME_MS) {
            // Calculate exponential backoff delay: 1s, 2s, 4s, 8s
            const delay = Math.min(
              INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt),
              MAX_RETRY_DELAY_MS * 4 // Allow up to 8s delay for timeouts
            );

            logWarn('Presence snapshot timed out, retrying', {
              attempt: attempt + 1,
              maxAttempts: MAX_TIMEOUT_RETRY_ATTEMPTS,
              delayMs: delay,
              elapsedTimeMs: elapsedTime,
              maxTotalTimeMs: MAX_TOTAL_RETRY_TIME_MS,
            });

            // Wait before retry with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Recursively retry
            return attemptLoad(attempt + 1);
          }

          // Check if it's a 401 Unauthorized error and we haven't exceeded max retries
          if (isUnauthorized && attempt < MAX_RETRY_ATTEMPTS) {
            // Calculate exponential backoff delay: 500ms, 1000ms, 2000ms
            const delay = Math.min(
              INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt),
              MAX_RETRY_DELAY_MS
            );

            logWarn('Presence snapshot failed with 401, retrying', {
              attempt: attempt + 1,
              maxAttempts: MAX_RETRY_ATTEMPTS,
              delayMs: delay,
            });

            // Wait before retry with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Recursively retry
            return attemptLoad(attempt + 1);
          }

          // Non-retryable error or max retries exceeded
          // Don't set error state - allow app to continue with empty lists
          // WebSocket will eventually populate presence data
          logWarn('Failed to load presence snapshot after retries, continuing with empty lists', {
            error: err,
            attempt: attempt + 1,
            isTimeout,
            isUnauthorized,
            elapsedTimeMs: elapsedTime,
          });

          // Set empty lists but don't set error - app continues to work
          // WebSocket will update presence in real-time once connected
          set({
            onlineUsers: [],
            offlineUsers: [],
            loading: false,
            error: null, // Don't show error to user - app continues to function
          });
          isLoadingSnapshot = false; // Reset flag on error so it can retry manually
        }
      };

      await attemptLoad();
    },

    /**
     * Connects to WebSocket for real-time presence updates
     * 
     * Sets up message handler and joins the presence group.
     * Marks the current user as online after connection.
     */
    connectWebSocket: async (
      currentEmail: string,
      currentRole?: string | null
    ): Promise<void> => {
      // Prevent duplicate connections
      if (isConnecting) {
        logDebug('WebSocket connection already in progress', { currentEmail });
        return;
      }

      if (webSocketService.isConnected()) {
        logDebug('WebSocket already connected', { currentEmail });
        return;
      }

      try {
        isConnecting = true;

        // Note: Actual message handling is done by registered handlers
        // The handlers are registered globally via WebSocketProvider

        // Connect to WebSocket
        await webSocketService.connect(currentEmail);
        await webSocketService.joinGroup(WEBSOCKET_GROUPS.PRESENCE);

        logInfo('Presence WebSocket connected', { currentEmail });

        // Mark current user as online (best-effort)
        try {
          await presenceClient.setOnline();
        } catch (error) {
          logError('Failed to mark user as online', { error, currentEmail });
        }
      } catch (error) {
        logError('Failed to connect presence WebSocket', { error, currentEmail });

        if (error instanceof Error) {
          throw new PresenceConnectionError('Failed to connect to presence WebSocket', error);
        }

        throw new PresenceConnectionError('Failed to connect to presence WebSocket');
      } finally {
        isConnecting = false;
      }
    },

    /**
     * Disconnects from WebSocket and marks user as offline
     * 
     * **Important**: This should only be called when the user actually logs out
     * or the application is closing. Do NOT call this during navigation in a SPA,
     * as the WebSocket should remain connected throughout the session.
     * 
     * @param markOffline - If true (default), marks the user as offline via API. 
     *                      Set to false if you only want to cleanup state without 
     *                      notifying the server (e.g., during app shutdown).
     */
    disconnectWebSocket: (markOffline: boolean = true): void => {
      // Only mark offline if requested (e.g., during actual logout)
      // During navigation in SPA, we should NOT mark offline
      if (markOffline) {
        presenceClient.setOffline().catch((error) => {
          logError('Failed to mark user as offline', { error });
        });
      }

      // Note: We don't disconnect the entire WebSocket service here
      // as it may be used by other modules. Only cleanup presence-specific state.
      isConnecting = false;
    },

    /**
     * Updates user status in the store
     * 
     * Called by PresenceMessageHandler when a presence message is received.
     * 
     * @param user - User status information
     * @param isOnline - Whether the user is online
     */
    updateUserStatus: (user: UserStatus, isOnline: boolean): void => {
      set((state) => {
        const wasOnline = state.onlineUsers.some((x) => x.email === user.email);
        const wasOffline = state.offlineUsers.some((x) => x.email === user.email);

        // Update user status in the user object
        const updatedUser: UserStatus = {
          ...user,
          status: isOnline ? PresenceStatus.Online : PresenceStatus.Offline,
        };

        // No change → skip set()
        if ((isOnline && wasOnline) || (!isOnline && wasOffline)) {
          return state;
        }

        let onlineUsers: UserStatus[];
        if (isOnline) {
          if (wasOnline) {
            // Update existing online user
            onlineUsers = state.onlineUsers.map((u) => (u.email === user.email ? updatedUser : u));
          } else {
            // Add new online user
            onlineUsers = [...state.onlineUsers, updatedUser];
          }
        } else {
          // Remove from online users
          onlineUsers = state.onlineUsers.filter((x) => x.email !== user.email);
        }

        let offlineUsers: UserStatus[];
        if (isOnline) {
          // Remove from offline users
          offlineUsers = state.offlineUsers.filter((x) => x.email !== user.email);
        } else if (wasOffline) {
          // Update existing offline user
          offlineUsers = state.offlineUsers.map((u) => (u.email === user.email ? updatedUser : u));
        } else {
          // Add new offline user
          offlineUsers = [...state.offlineUsers, updatedUser];
        }

        return { onlineUsers, offlineUsers };
      });
    },

    /**
     * Updates supervisor information for affected users
     * 
     * Called by SupervisorChangeNotificationHandler when supervisor changes.
     * This is a delegated method - the presence store doesn't know about
     * supervisor logic, it just updates the data when requested.
     * 
     * @param info - Supervisor information update
     */
    updateSupervisorInfo: (info: SupervisorInfoUpdate): void => {
      set((state) => {
        const updatedOnlineUsers = state.onlineUsers.map((user) => {
          // Update PSOs that were transferred
          if (info.psoEmails.includes(user.email)) {
            return {
              ...user,
              supervisorEmail: info.newSupervisorEmail,
              supervisorId: info.newSupervisorId,
              supervisorName: info.newSupervisorName,
            };
          }
          return user;
        });

        const updatedOfflineUsers = state.offlineUsers.map((user) => {
          // Update PSOs that were transferred
          if (info.psoEmails.includes(user.email)) {
            return {
              ...user,
              supervisorEmail: info.newSupervisorEmail,
              supervisorId: info.newSupervisorId,
              supervisorName: info.newSupervisorName,
            };
          }
          return user;
        });

        return {
          onlineUsers: updatedOnlineUsers,
          offlineUsers: updatedOfflineUsers,
        };
      });
    },
  };
});

