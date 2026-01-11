/**
 * @fileoverview Reconnection utilities for LiveKit room connection
 * @summary Utility functions for managing reconnection logic
 * @description Utilities for calculating reconnection delays, detecting refresh scenarios,
 * and managing reconnection state following SRP (Single Responsibility Principle)
 */

import { DisconnectReason } from 'livekit-client';
import { logDebug, logWarn } from '@/shared/utils/logger';
import {
  INITIAL_RECONNECT_DELAY_MS,
  NORMAL_RECONNECT_DELAY_MS,
  MAX_RECONNECT_DELAY_MS,
  RECONNECT_DELAY_MULTIPLIER,
  DUPLICATE_IDENTITY_WINDOW_MS,
  REFRESH_DETECTED_DELAY_MS,
  REFRESH_DETECTION_THRESHOLD,
  MAX_RECONNECT_ATTEMPTS,
} from '../constants/roomConnectionConstants';
import type {
  IReconnectionState,
  IReconnectionDelayParams,
  IReconnectionDelayResult,
} from '../types/roomConnectionTypes';

/**
 * Initializes a new reconnection state
 * @returns New reconnection state
 */
export function createInitialReconnectionState(): IReconnectionState {
  return {
    attempts: 0,
    lastDisconnectTime: 0,
    duplicateIdentityCount: 0,
  };
}

/**
 * Resets reconnection state to initial values
 * @param state - Current reconnection state to reset
 * @returns Reset reconnection state
 */
export function resetReconnectionState(state: IReconnectionState): IReconnectionState {
  return {
    attempts: 0,
    lastDisconnectTime: 0,
    duplicateIdentityCount: 0,
  };
}

/**
 * Checks if reason is DUPLICATE_IDENTITY
 * @param reason - Disconnect reason to check
 * @returns True if reason is DUPLICATE_IDENTITY
 */
export function isDuplicateIdentityReason(reason?: DisconnectReason): boolean {
  if (!reason) return false;
  const reasonCode = String(reason);
  return reasonCode === '2' || reason === DisconnectReason.DUPLICATE_IDENTITY;
}

/**
 * Updates reconnection state with new disconnect information
 * @param state - Current reconnection state
 * @param reason - Disconnect reason
 * @returns Updated reconnection state
 */
export function updateReconnectionState(
  state: IReconnectionState,
  reason?: DisconnectReason
): IReconnectionState {
  const now = Date.now();
  const isDuplicateIdentity = isDuplicateIdentityReason(reason);
  const timeSinceLastDisconnect = now - state.lastDisconnectTime;

  let duplicateIdentityCount = state.duplicateIdentityCount;

  // Track rapid DUPLICATE_IDENTITY disconnections
  if (isDuplicateIdentity && timeSinceLastDisconnect < DUPLICATE_IDENTITY_WINDOW_MS) {
    duplicateIdentityCount += 1;
  } else if (isDuplicateIdentity) {
    // New window, reset count
    duplicateIdentityCount = 1;
  } else {
    // Not duplicate identity, reset count
    duplicateIdentityCount = 0;
  }

  return {
    attempts: state.attempts + 1,
    lastDisconnectTime: now,
    duplicateIdentityCount,
  };
}

/**
 * Detects if refresh scenario is happening based on rapid DUPLICATE_IDENTITY disconnections
 * @param state - Current reconnection state
 * @returns True if refresh is detected
 */
export function isRefreshDetected(state: IReconnectionState): boolean {
  return state.duplicateIdentityCount >= REFRESH_DETECTION_THRESHOLD;
}

/**
 * Calculates reconnection delay with exponential backoff
 * @param params - Parameters for delay calculation
 * @returns Reconnection delay result
 */
export function calculateReconnectionDelay(
  params: IReconnectionDelayParams
): IReconnectionDelayResult {
  const { reason, state } = params;

  // Check max attempts
  if (state.attempts >= MAX_RECONNECT_ATTEMPTS) {
    logWarn('[reconnectionUtils] Max reconnect attempts reached', {
      attempts: state.attempts,
      reason: reason ? String(reason) : 'unknown',
    });
    return {
      delayMs: 0,
      isRefreshDetected: false,
      shouldReconnect: false,
    };
  }

  const isDuplicateIdentity = isDuplicateIdentityReason(reason);
  const refreshDetected = isRefreshDetected(state);

  // Determine base delay
  let baseDelay: number;
  if (refreshDetected) {
    baseDelay = REFRESH_DETECTED_DELAY_MS;
  } else if (isDuplicateIdentity) {
    baseDelay = INITIAL_RECONNECT_DELAY_MS;
  } else {
    baseDelay = NORMAL_RECONNECT_DELAY_MS;
  }

  // Calculate exponential backoff
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(RECONNECT_DELAY_MULTIPLIER, state.attempts - 1),
    MAX_RECONNECT_DELAY_MS
  );

  logDebug('[reconnectionUtils] Calculated reconnection delay', {
    reason: reason ? String(reason) : 'unknown',
    attempt: state.attempts,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    delayMs: exponentialDelay,
    isRefreshDetected: refreshDetected,
    duplicateIdentityCount: state.duplicateIdentityCount,
  });

  return {
    delayMs: exponentialDelay,
    isRefreshDetected: refreshDetected,
    shouldReconnect: true,
  };
}

