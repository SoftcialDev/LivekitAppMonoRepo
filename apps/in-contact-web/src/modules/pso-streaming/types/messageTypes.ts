/**
 * @fileoverview WebSocket message types
 * @summary Type definitions for WebSocket message parsing
 * @description Interfaces for parsed WebSocket messages
 */

/**
 * Parsed message information from WebSocket
 */
export interface ParsedMessage {
  targetEmail: string | null;
  started: boolean | null;
  pending: boolean;
  failed: boolean;
}

