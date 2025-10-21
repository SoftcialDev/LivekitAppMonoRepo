/**
 * @fileoverview WebSocketMessages - Type definitions for WebSocket messages
 * @summary Centralized type definitions for all WebSocket message types
 * @description Provides type safety and validation for WebSocket messages across the application
 */

import { UserStatus } from './UserStatus';

/**
 * Base interface for all WebSocket messages
 */
export interface BaseWebSocketMessage {
  type: string;
  timestamp?: string;
}

/**
 * Supervisor change notification message (for admins/supervisors)
 */
export interface SupervisorChangeNotificationMessage extends BaseWebSocketMessage {
  type: 'supervisor_change_notification';
  data: {
    psoEmails: string[];
    oldSupervisorEmail?: string;
    newSupervisorEmail: string;
    newSupervisorId?: string;
    psoNames: string[];
    newSupervisorName: string;
  };
}

/**
 * PSO supervisor changed message (for individual PSOs)
 */
export interface PsoSupervisorChangedMessage extends BaseWebSocketMessage {
  type: 'SUPERVISOR_CHANGED';
  newSupervisorName: string;
  timestamp: string;
}

/**
 * Presence message for user status updates
 */
export interface PresenceMessage extends BaseWebSocketMessage {
  type: 'presence';
  user: UserStatus;
}

/**
 * Command message for PSO actions
 */
export interface CommandMessage extends BaseWebSocketMessage {
  type: 'command';
  command: string;
  data: any;
}

/**
 * Heartbeat message for connection health
 */
export interface HeartbeatMessage extends BaseWebSocketMessage {
  type: 'heartbeat';
  status: 'alive' | 'dead';
}

/**
 * Union type for all possible WebSocket messages
 */
export type WebSocketMessage = 
  | SupervisorChangeNotificationMessage
  | PsoSupervisorChangedMessage
  | PresenceMessage
  | CommandMessage
  | HeartbeatMessage;

/**
 * Type guard to check if message is a supervisor change notification
 * @param message - WebSocket message to check
 * @returns True if message is a supervisor change notification
 */
export function isSupervisorChangeNotificationMessage(message: any): message is SupervisorChangeNotificationMessage {
  return message?.type === 'supervisor_change_notification' && message?.data;
}

/**
 * Type guard to check if message is a PSO supervisor changed message
 * @param message - WebSocket message to check
 * @returns True if message is a PSO supervisor changed message
 */
export function isPsoSupervisorChangedMessage(message: any): message is PsoSupervisorChangedMessage {
  return message?.type === 'SUPERVISOR_CHANGED' && typeof message?.newSupervisorName === 'string';
}

/**
 * Type guard to check if message is a presence message
 * @param message - WebSocket message to check
 * @returns True if message is a presence message
 */
export function isPresenceMessage(message: any): message is PresenceMessage {
  return message?.type === 'presence' && message?.user;
}

/**
 * Type guard to check if message is a command message
 * @param message - WebSocket message to check
 * @returns True if message is a command message
 */
export function isCommandMessage(message: any): message is CommandMessage {
  return message?.type === 'command' && message?.command;
}

/**
 * Type guard to check if message is a heartbeat message
 * @param message - WebSocket message to check
 * @returns True if message is a heartbeat message
 */
export function isHeartbeatMessage(message: any): message is HeartbeatMessage {
  return message?.type === 'heartbeat' && message?.status;
}