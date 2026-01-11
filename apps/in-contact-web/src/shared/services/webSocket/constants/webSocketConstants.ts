/**
 * @fileoverview WebSocket constants
 * @summary Constants for WebSocket service configuration
 * @description Centralized constants for WebSocket message types and configuration
 */

/**
 * WebSocket message type constants
 */
export const WEBSOCKET_MESSAGE_TYPES = {
  // Supervisor change notifications
  SUPERVISOR_CHANGE_NOTIFICATION: 'supervisor_change_notification',
  PSO_SUPERVISOR_CHANGED: 'SUPERVISOR_CHANGED',
  SUPERVISOR_LIST_CHANGED: 'supervisor_list_changed',
  
  // Presence and status
  PRESENCE: 'presence',
  HEARTBEAT: 'heartbeat',
  
  // Commands and actions
  COMMAND: 'command',
  
  // Contact Manager notifications
  CONTACT_MANAGER_STATUS: 'contact_manager_status',
  
  // Streaming notifications
  STREAMING_STATUS: 'streaming_status',
  STREAMING_SESSION_UPDATE: 'streaming_session_update',
} as const;

/**
 * Type for WebSocket message type values
 */
export type WebSocketMessageType = typeof WEBSOCKET_MESSAGE_TYPES[keyof typeof WEBSOCKET_MESSAGE_TYPES];

/**
 * Supervisor change related message types
 */
export const SUPERVISOR_MESSAGE_TYPES = [
  WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_CHANGE_NOTIFICATION,
  WEBSOCKET_MESSAGE_TYPES.PSO_SUPERVISOR_CHANGED,
  WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_LIST_CHANGED,
] as const;

/**
 * Presence related message types
 */
export const PRESENCE_MESSAGE_TYPES = [
  WEBSOCKET_MESSAGE_TYPES.PRESENCE,
  WEBSOCKET_MESSAGE_TYPES.HEARTBEAT,
] as const;

/**
 * Command related message types
 */
export const COMMAND_MESSAGE_TYPES = [
  WEBSOCKET_MESSAGE_TYPES.COMMAND,
] as const;

/**
 * WebSocket groups
 */
export const WEBSOCKET_GROUPS = {
  PRESENCE: 'presence',
  CM_STATUS_UPDATES: 'cm-status-updates',
} as const;

/**
 * Reconnect configuration
 */
export const RECONNECT_CONFIG = {
  INITIAL_BACKOFF_MS: 1000,
  MAX_BACKOFF_MS: 30000,
  JITTER_MAX_MS: 400,
} as const;

