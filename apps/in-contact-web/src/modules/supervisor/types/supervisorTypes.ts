/**
 * @fileoverview Supervisor type definitions
 * @summary Type definitions for supervisor module
 * @description Defines interfaces and types for supervisor operations and notifications
 */

import { WEBSOCKET_MESSAGE_TYPES } from '@/shared/services/webSocket/constants/webSocketConstants';

/**
 * Supervisor change notification data
 */
export interface ISupervisorChangeData {
  /**
   * Array of PSO emails affected by the change
   */
  psoEmails: string[];

  /**
   * Old supervisor email (if applicable)
   */
  oldSupervisorEmail?: string;

  /**
   * New supervisor email
   */
  newSupervisorEmail: string;

  /**
   * New supervisor ID
   */
  newSupervisorId?: string;

  /**
   * Array of PSO names affected
   */
  psoNames: string[];

  /**
   * New supervisor name
   */
  newSupervisorName: string;
}

/**
 * Supervisor change notification message from WebSocket
 */
export interface ISupervisorChangeNotificationMessage {
  /**
   * Message type
   */
  type: typeof WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_CHANGE_NOTIFICATION;

  /**
   * Supervisor change data
   */
  data: ISupervisorChangeData;
}

/**
 * Supervisor list changed message from WebSocket
 */
export interface ISupervisorListChangedMessage {
  /**
   * Message type
   */
  type: typeof WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_LIST_CHANGED;

  /**
   * Supervisor list change data
   */
  data: unknown;
}

/**
 * PSO supervisor changed message (for individual PSOs)
 */
export interface IPsoSupervisorChangedMessage {
  /**
   * Message type
   */
  type: 'SUPERVISOR_CHANGED';

  /**
   * New supervisor name
   */
  newSupervisorName: string;

  /**
   * Timestamp when change occurred
   */
  timestamp: string;
}

