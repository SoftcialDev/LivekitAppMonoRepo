/**
 * @fileoverview WebSocket handshake retry manager
 * @summary Handles retry logic for WebSocket handshake errors (500)
 * @description Manages retry attempts for WebSocket handshake failures with WSS URL.
 * When client.start() fails with 500 error, this manager retries the complete
 * connection process (negotiate + create client + start) with fixed intervals.
 * Triggers page refresh if all retry attempts fail. Checks for active connection
 * before retrying to avoid redundant attempts.
 */

import { logError, logWarn, logDebug } from '@/shared/utils/logger';
import {
  WebSocketConnectionActiveError,
  WebSocketHandshakeError,
} from '@/shared/errors';
import type { WebPubSubClient } from '@azure/web-pubsub-client';

/**
 * Configuration for handshake retry logic
 */
const HANDSHAKE_RETRY_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_INTERVAL_MS: 12000, // 12 seconds
  TOTAL_RETRY_WINDOW_MS: 60000, // 1 minute
} as const;

/**
 * WebSocket handshake retry manager
 * 
 * Manages retry logic for WebSocket handshake errors including:
 * - Detection of handshake/500 errors
 * - Retry attempts with fixed intervals
 * - Connection state checking to avoid redundant retries
 * - Page refresh on complete failure
 */
export class WebSocketHandshakeRetryManager {
  /**
   * Checks if error is a handshake/500 error
   * 
   * @param error - Error to check
   * @returns True if error is handshake-related
   */
  isHandshakeError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('500') ||
        message.includes('handshake') ||
        message.includes('websocket') ||
        message.includes('connection failed') ||
        error.name === 'WebSocketError' ||
        error.name === 'ConnectionError'
      );
    }
    return false;
  }

  /**
   * Handles handshake failure by refreshing page
   * @param attempt - Attempt number
   * @param elapsed - Time elapsed
   * @param error - Error that occurred
   * @throws The error that was passed in
   */
  private handleHandshakeFailure(
    attempt: number,
    elapsed: number,
    error: unknown
  ): never {
    logError('All handshake retry attempts failed, refreshing page', {
      attempts: attempt + 1,
      elapsed,
      error,
    });
    if (globalThis.window !== undefined) {
      globalThis.window.location.reload();
    }
    throw error;
  }

  /**
   * Handles retry attempt error
   * @param error - Error that occurred
   * @param attempt - Attempt number
   * @param startTime - Start time of retry process
   * @param isConnectedFn - Function that checks if connection is active
   * @returns Promise that resolves after delay
   * @throws If connection active, non-handshake error, or retries exhausted
   */
  private async handleRetryError(
    error: unknown,
    attempt: number,
    startTime: number,
    isConnectedFn: () => boolean
  ): Promise<void> {
    // Check if connection was established by another process
    if (isConnectedFn()) {
      logDebug('Connection established by another process during retry', {
        attempt: attempt + 1,
      });
      throw new WebSocketConnectionActiveError('Connection established by another process');
    }

    // Only retry if it's a handshake error
    if (!this.isHandshakeError(error)) {
      logDebug('Non-handshake error, not retrying', {
        error,
        attempt: attempt + 1,
      });
      throw error;
    }

    const elapsed = Date.now() - startTime;
    const isLastAttempt = attempt === HANDSHAKE_RETRY_CONFIG.MAX_RETRIES - 1;
    const isTimeout = elapsed >= HANDSHAKE_RETRY_CONFIG.TOTAL_RETRY_WINDOW_MS;

    if (isLastAttempt || isTimeout) {
      this.handleHandshakeFailure(attempt, elapsed, error);
    }

    logWarn('Handshake failed, retrying connection', {
      attempt: attempt + 1,
      maxRetries: HANDSHAKE_RETRY_CONFIG.MAX_RETRIES,
      nextRetryIn: HANDSHAKE_RETRY_CONFIG.RETRY_INTERVAL_MS,
      error,
    });

    await new Promise(resolve =>
      setTimeout(resolve, HANDSHAKE_RETRY_CONFIG.RETRY_INTERVAL_MS)
    );
  }

  /**
   * Attempts to establish connection with retry logic for handshake errors
   * 
   * Checks for active connection before each retry to avoid redundant attempts.
   * 
   * @param connectFn - Function that performs full connection (negotiate + create + start)
   * @param isConnectedFn - Function that checks if connection is already active
   * @returns Promise that resolves when connection is established
   * @throws If all retry attempts fail
   */
  async connectWithRetry(
    connectFn: () => Promise<WebPubSubClient>,
    isConnectedFn: () => boolean
  ): Promise<WebPubSubClient> {
    const startTime = Date.now();

    for (let attempt = 0; attempt < HANDSHAKE_RETRY_CONFIG.MAX_RETRIES; attempt++) {
      // Check if already connected before attempting
      if (isConnectedFn()) {
        logDebug('Connection already active, skipping handshake retry', {
          attempt: attempt + 1,
        });
        throw new WebSocketConnectionActiveError('Connection already active');
      }

      try {
        const client = await connectFn();
        logDebug('Handshake retry succeeded', {
          attempt: attempt + 1,
        });
        return client;
      } catch (error) {
        await this.handleRetryError(error, attempt, startTime, isConnectedFn);
      }
    }

    throw new WebSocketHandshakeError('Handshake failed after all retries');
  }
}

