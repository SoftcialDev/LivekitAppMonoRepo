/**
 * @fileoverview LiveKit room connection types
 * @summary Type definitions for LiveKit room connection hook
 * @description Types for managing LiveKit room connections and reconnection logic
 */

import type { Room, DisconnectReason } from 'livekit-client';

/**
 * Options for useLiveKitRoomConnection hook
 */
export interface IUseLiveKitRoomConnectionOptions {
  /**
   * Whether streaming should be active
   */
  shouldStream: boolean;
  /**
   * LiveKit access token
   */
  accessToken: string | null;
  /**
   * Room name/identity
   */
  roomName: string | null;
  /**
   * LiveKit server URL
   */
  livekitUrl: string | null;
  /**
   * Reference to store the room instance
   */
  roomRef: React.RefObject<Room | null>;
  /**
   * Callback when room is connected
   */
  onRoomConnected?: (room: Room) => void;
  /**
   * Callback when room is disconnected
   */
  onRoomDisconnected?: () => void;
}

/**
 * Return type for useLiveKitRoomConnection hook
 */
export interface IUseLiveKitRoomConnectionReturn {
  /**
   * Whether the room is currently connected
   */
  isConnected: boolean;
  /**
   * Whether connection is in progress
   */
  isConnecting: boolean;
  /**
   * Whether disconnection is in progress
   */
  isDisconnecting: boolean;
  /**
   * Connection error if any
   */
  error: Error | null;
  /**
   * Manually disconnect the room
   */
  disconnect: () => Promise<void>;
}

/**
 * Options for useRoomConnection hook
 */
export interface IUseRoomConnectionOptions {
  shouldStream: boolean;
  accessToken: string | null;
  roomName: string | null;
  livekitUrl: string | null;
  onConnected: (room: Room) => void;
  onDisconnected: (reason?: DisconnectReason) => void;
  onReconnecting: () => void;
}

/**
 * Return type for useRoomConnection hook
 */
export interface IUseRoomConnectionReturn {
  connect: () => Promise<Room | null>;
  isConnecting: boolean;
  error: Error | null;
}

/**
 * Options for useRoomReconnection hook
 */
export interface IUseRoomReconnectionOptions {
  shouldStream: boolean;
  onReconnect: () => void;
}

/**
 * Return type for useRoomReconnection hook
 */
export interface IUseRoomReconnectionReturn {
  handleDisconnection: (reason?: DisconnectReason) => void;
  reset: () => void;
  cancel: () => void;
}

/**
 * State tracking for reconnection attempts and duplicate identity detection
 */
export interface IReconnectionState {
  /**
   * Number of reconnection attempts made
   */
  attempts: number;
  /**
   * Timestamp of last disconnect event
   */
  lastDisconnectTime: number;
  /**
   * Count of rapid DUPLICATE_IDENTITY disconnections (for refresh detection)
   */
  duplicateIdentityCount: number;
}

/**
 * Parameters for calculating reconnection delay
 */
export interface IReconnectionDelayParams {
  /**
   * Disconnect reason that triggered the reconnection
   */
  reason?: DisconnectReason;
  /**
   * Current reconnection state
   */
  state: IReconnectionState;
}

/**
 * Result of reconnection delay calculation
 */
export interface IReconnectionDelayResult {
  /**
   * Calculated delay in milliseconds before next reconnection attempt
   */
  delayMs: number;
  /**
   * Whether refresh scenario was detected
   */
  isRefreshDetected: boolean;
  /**
   * Whether reconnection should proceed
   */
  shouldReconnect: boolean;
}
