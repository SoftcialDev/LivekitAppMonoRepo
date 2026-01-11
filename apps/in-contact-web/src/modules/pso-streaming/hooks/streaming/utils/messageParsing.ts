/**
 * @fileoverview WebSocket message parsing utilities
 * @summary Helper functions for parsing WebSocket messages
 * @description Utilities for extracting information from WebSocket messages
 */

import type { ParsedMessage } from '../../../types';

/**
 * Parses a WebSocket message to extract command/status information
 */
export function parseWebSocketMessage(msg: unknown): ParsedMessage {
  const result: ParsedMessage = {
    targetEmail: null,
    started: null,
    pending: false,
    failed: false,
  };

  if (typeof msg !== 'object' || msg === null) {
    return result;
  }

  if ('command' in msg && 'employeeEmail' in msg) {
    const commandMsg = msg as { command: string; employeeEmail: string };
    result.targetEmail = String(commandMsg.employeeEmail).toLowerCase();
    if (commandMsg.command === 'START') {
      result.started = true;
    } else if (commandMsg.command === 'STOP') {
      result.started = false;
    }
  } else if ('email' in msg && 'status' in msg) {
    const statusMsg = msg as { email: string; status: string };
    result.targetEmail = String(statusMsg.email).toLowerCase();
    const status = statusMsg.status;
    if (status === 'started') {
      result.started = true;
    } else if (status === 'stopped') {
      result.started = false;
    } else if (status === 'pending') {
      result.pending = true;
    } else if (status === 'failed') {
      result.failed = true;
    }
  }

  return result;
}

