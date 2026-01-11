/**
 * @fileoverview WebSocketError - Error classes for WebSocket-related errors
 * @summary Error classes for WebSocket connection and communication errors
 * @description Specific error classes for WebSocket handshake, connection, and group join errors
 */

import { AppError } from './AppError';

/**
 * Error thrown when WebSocket connection is already active
 */
export class WebSocketConnectionActiveError extends AppError {
  constructor(message: string = 'WebSocket connection is already active', cause?: Error) {
    super(message, cause);
    this.name = 'WebSocketConnectionActiveError';
  }
}

/**
 * Error thrown when WebSocket connection is lost
 */
export class WebSocketConnectionLostError extends AppError {
  constructor(message: string = 'WebSocket connection was lost', cause?: Error) {
    super(message, cause);
    this.name = 'WebSocketConnectionLostError';
  }
}

/**
 * Error thrown when WebSocket handshake fails
 */
export class WebSocketHandshakeError extends AppError {
  constructor(message: string = 'WebSocket handshake failed', cause?: Error) {
    super(message, cause);
    this.name = 'WebSocketHandshakeError';
  }
}

/**
 * Error thrown when WebSocket connection is not active (for operations that require active connection)
 */
export class WebSocketNotConnectedError extends AppError {
  constructor(message: string = 'WebSocket connection is not active', cause?: Error) {
    super(message, cause);
    this.name = 'WebSocketNotConnectedError';
  }
}

