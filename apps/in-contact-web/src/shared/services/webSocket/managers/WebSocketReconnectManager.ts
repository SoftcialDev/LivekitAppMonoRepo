/**
 * @fileoverview WebSocket reconnect manager
 * @summary Manages reconnection logic with exponential backoff
 * @description Handles reconnection scheduling with exponential backoff and jitter
 */

import { logDebug } from '@/shared/utils/logger';
import { RECONNECT_CONFIG } from '../constants/webSocketConstants';

/**
 * WebSocket reconnect manager
 * 
 * Manages reconnection logic including:
 * - Exponential backoff calculation
 * - Jitter addition for distributed reconnect attempts
 * - Reconnect timer management
 */
export class WebSocketReconnectManager {
  /**
   * Current backoff delay in milliseconds
   */
  private backoffMs: number = RECONNECT_CONFIG.INITIAL_BACKOFF_MS;

  /**
   * Current reconnect timer
   */
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * Gets the current backoff value
   * 
   * @returns Current backoff in milliseconds
   */
  getBackoff(): number {
    return this.backoffMs;
  }

  /**
   * Resets the backoff to its initial value
   */
  resetBackoff(): void {
    this.backoffMs = RECONNECT_CONFIG.INITIAL_BACKOFF_MS;
  }

  /**
   * Increases the backoff exponentially up to a maximum cap
   */
  increaseBackoff(): void {
    this.backoffMs = Math.min(
      this.backoffMs * 2,
      RECONNECT_CONFIG.MAX_BACKOFF_MS
    );
  }

  /**
   * Calculates reconnect delay with jitter
   * 
   * @param immediate - If true, returns 0 delay
   * @returns Delay in milliseconds
   */
  calculateDelay(immediate: boolean = false): number {
    if (immediate) {
      return 0;
    }

    const jitter = Math.floor(
      Math.random() * RECONNECT_CONFIG.JITTER_MAX_MS
    );
    return Math.min(
      this.backoffMs + jitter,
      RECONNECT_CONFIG.MAX_BACKOFF_MS
    );
  }

  /**
   * Schedules a reconnect attempt
   * 
   * @param reconnectFn - Function to call for reconnection
   * @param reason - Human-readable reason for diagnostics
   * @param immediate - If true, attempts reconnect without delay
   */
  scheduleReconnect(
    reconnectFn: () => Promise<void>,
    reason: string,
    immediate: boolean = false
  ): void {
    this.clearReconnectTimer();

    const delay = this.calculateDelay(immediate);

    logDebug('Scheduling WebSocket reconnect', { reason, delayMs: delay });

    this.reconnectTimer = setTimeout(async () => {
      try {
        await reconnectFn();
        this.resetBackoff();
      } catch {
        this.increaseBackoff();
        // Schedule next reconnect attempt
        this.scheduleReconnect(reconnectFn, 'reconnect failed', false);
      }
    }, delay);
  }

  /**
   * Clears any scheduled reconnect timer
   */
  clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Cleans up all resources
   */
  cleanup(): void {
    this.clearReconnectTimer();
    this.resetBackoff();
  }
}

