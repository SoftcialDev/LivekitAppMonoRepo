/**
 * @fileoverview StreamingStopReason enum
 * @summary Enum representing stop reasons for streaming sessions
 * @description Enum representing the different reasons a streaming session can be stopped
 */

/**
 * Enum representing stop reasons for streaming sessions
 */
export enum StreamingStopReason {
  QUICK_BREAK = 'QUICK_BREAK',
  SHORT_BREAK = 'SHORT_BREAK',
  LUNCH_BREAK = 'LUNCH_BREAK',
  EMERGENCY = 'EMERGENCY',
  END_OF_SHIFT = 'END_OF_SHIFT',
  COMMAND = 'COMMAND',
  DISCONNECT = 'DISCONNECT',
}

