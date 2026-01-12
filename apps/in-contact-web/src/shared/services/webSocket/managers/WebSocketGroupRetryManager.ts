/**
 * @fileoverview WebSocket group retry manager
 * @summary Handles retry logic for joining WebSocket groups
 * @description Manages retry attempts for joining critical WebSocket groups
 * (like commands group), with fixed intervals and maximum attempt limits.
 * Triggers page refresh if all retry attempts fail for critical groups.
 * Checks for active connection before retrying to avoid redundant attempts.
 */

import { logError, logWarn, logDebug } from '@/shared/utils/logger';
import {
  WebSocketNotConnectedError,
  WebSocketConnectionLostError,
} from '@/shared/errors';

/**
 * Configuration for group retry logic
 */
const GROUP_RETRY_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_INTERVAL_MS: 12000, // 12 seconds
  TOTAL_RETRY_WINDOW_MS: 60000, // 1 minute
} as const;

/**
 * Critical groups that require page refresh on complete failure
 */
const CRITICAL_GROUPS = ['commands'] as const;

/**
 * WebSocket group retry manager
 * 
 * Manages retry logic for joining WebSocket groups including:
 * - Retry attempts with fixed intervals
 * - Critical group detection
 * - Connection state checking to avoid redundant retries
 * - Page refresh on critical group failure
 */
export class WebSocketGroupRetryManager {
  /**
   * Checks if a group is critical
   * 
   * @param groupName - Group name to check
   * @returns True if group is critical
   */
  private isCriticalGroup(groupName: string): boolean {
    const normalized = groupName.toLowerCase();
    return CRITICAL_GROUPS.some(critical => normalized.includes(critical));
  }

  /**
   * Handles critical group failure by refreshing page
   * @param groupName - Group name that failed
   * @param attempt - Attempt number
   * @param elapsed - Time elapsed
   * @param error - Error that occurred
   * @throws The error that was passed in
   */
  private handleCriticalGroupFailure(
    groupName: string,
    attempt: number,
    elapsed: number,
    error: unknown
  ): never {
    logError('Failed to join critical group after all retries, refreshing page', {
      group: groupName,
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
   * Handles non-critical group failure
   * @param groupName - Group name that failed
   * @param attempt - Attempt number
   * @param elapsed - Time elapsed
   * @param error - Error that occurred
   * @throws The error that was passed in
   */
  private handleGroupFailure(
    groupName: string,
    attempt: number,
    elapsed: number,
    error: unknown
  ): never {
    logWarn('Failed to join group after all retries', {
      group: groupName,
      attempts: attempt + 1,
      elapsed,
    });
    throw error;
  }

  /**
   * Handles retry attempt error
   * @param error - Error that occurred
   * @param groupName - Group name
   * @param attempt - Attempt number
   * @param startTime - Start time of retry process
   * @param isCritical - Whether group is critical
   * @param isConnectedFn - Function that checks if connection is active
   * @returns Promise that resolves after delay
   * @throws If connection lost or retries exhausted
   */
  private async handleRetryError(
    error: unknown,
    groupName: string,
    attempt: number,
    startTime: number,
    isCritical: boolean,
    isConnectedFn: () => boolean
  ): Promise<void> {
    // Check if connection was lost
    if (!isConnectedFn()) {
      logDebug('Connection lost during group join retry', {
        group: groupName,
        attempt: attempt + 1,
      });
      throw new WebSocketConnectionLostError('Connection lost');
    }

    const elapsed = Date.now() - startTime;
    const isLastAttempt = attempt === GROUP_RETRY_CONFIG.MAX_RETRIES - 1;
    const isTimeout = elapsed >= GROUP_RETRY_CONFIG.TOTAL_RETRY_WINDOW_MS;

    if ((isLastAttempt || isTimeout) && isCritical) {
      this.handleCriticalGroupFailure(groupName, attempt, elapsed, error);
    }

    if (isLastAttempt || isTimeout) {
      this.handleGroupFailure(groupName, attempt, elapsed, error);
    }

    logWarn('Group join failed, retrying', {
      group: groupName,
      attempt: attempt + 1,
      maxRetries: GROUP_RETRY_CONFIG.MAX_RETRIES,
      nextRetryIn: GROUP_RETRY_CONFIG.RETRY_INTERVAL_MS,
    });

    await new Promise(resolve =>
      setTimeout(resolve, GROUP_RETRY_CONFIG.RETRY_INTERVAL_MS)
    );
  }

  /**
   * Attempts to join group with retry logic
   * 
   * Checks for active connection before each retry to avoid redundant attempts.
   * 
   * @param groupName - Group name to join
   * @param joinFn - Function that performs group join
   * @param isConnectedFn - Function that checks if connection is active
   * @returns Promise that resolves when group is joined
   * @throws If all retry attempts fail
   */
  async joinGroupWithRetry(
    groupName: string,
    joinFn: () => Promise<void>,
    isConnectedFn: () => boolean
  ): Promise<void> {
    const isCritical = this.isCriticalGroup(groupName);
    const startTime = Date.now();

    for (let attempt = 0; attempt < GROUP_RETRY_CONFIG.MAX_RETRIES; attempt++) {
      // Check if connection is still active before attempting
      if (!isConnectedFn()) {
        logDebug('Connection not active, skipping group join retry', {
          group: groupName,
          attempt: attempt + 1,
        });
        throw new WebSocketNotConnectedError('Connection not active');
      }

      try {
        await joinFn();
        logDebug('Group join succeeded', {
          group: groupName,
          attempt: attempt + 1,
        });
        return; // Success
      } catch (error) {
        await this.handleRetryError(error, groupName, attempt, startTime, isCritical, isConnectedFn);
      }
    }
  }
}

