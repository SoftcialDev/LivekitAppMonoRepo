/**
 * @fileoverview Recording command client types
 * @summary Type definitions for recording command API client
 * @description Types for recording command requests and responses
 */

/**
 * Recording command types
 */
export type RecordingCommand = 'START' | 'STOP';

/**
 * Request payload for recording commands
 */
export interface RecordingCommandRequest {
  command: RecordingCommand;
  roomName: string;
}

/**
 * Response from recording command
 */
export interface RecordingCommandResponse {
  message: string;
  roomName: string;
  stoppedCount?: number;
}

