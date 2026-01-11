/**
 * @fileoverview Presence store type definitions
 * @summary Type definitions for presence store
 * @description Defines interfaces for presence store state and operations
 */

import type { UserStatus, SupervisorInfoUpdate } from '../../../types/presenceTypes';

/**
 * Presence store state interface
 */
export interface IPresenceState {
  /**
   * Users currently online
   */
  onlineUsers: UserStatus[];

  /**
   * Users currently offline
   */
  offlineUsers: UserStatus[];

  /**
   * Whether presence data is currently loading
   */
  loading: boolean;

  /**
   * Error message if loading failed, null otherwise
   */
  error: string | null;

  /**
   * Loads initial presence snapshot from REST API
   * 
   * This should be called once on mount to get the initial state.
   * Subsequent updates come via WebSocket.
   * 
   * @returns Promise that resolves when snapshot is loaded
   */
  loadSnapshot(): Promise<void>;

  /**
   * Connects to WebSocket for real-time presence updates
   * 
   * @param currentEmail - Email of the current user
   * @param currentRole - Optional role of the current user
   * @returns Promise that resolves when connection is established
   */
  connectWebSocket(currentEmail: string, currentRole?: string | null): Promise<void>;

  /**
   * Disconnects from WebSocket and marks user as offline
   * 
   * @param markOffline - If true (default), marks the user as offline via API.
   *                      Set to false if you only want to cleanup state without
   *                      notifying the server (e.g., during app shutdown).
   */
  disconnectWebSocket(markOffline?: boolean): void;

  /**
   * Updates user status in the store
   * 
   * Called by PresenceMessageHandler when a presence message is received.
   * 
   * @param user - User status information
   * @param isOnline - Whether the user is online
   */
  updateUserStatus(user: UserStatus, isOnline: boolean): void;

  /**
   * Updates supervisor information for affected users
   * 
   * Called by SupervisorChangeNotificationHandler when supervisor changes.
   * This is a delegated method - the presence store doesn't know about
   * supervisor logic, it just updates the data when requested.
   * 
   * @param info - Supervisor information update
   */
  updateSupervisorInfo(info: SupervisorInfoUpdate): void;
}

