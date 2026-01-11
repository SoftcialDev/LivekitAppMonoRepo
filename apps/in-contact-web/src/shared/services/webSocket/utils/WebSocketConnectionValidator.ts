/**
 * @fileoverview WebSocket connection validator utility
 */

import type { IConnectionValidationResult } from '../types/webSocketValidatorTypes';

/**
 * WebSocket connection validator utility
 * 
 * Encapsulates validation logic for connection operations,
 * separating concerns from the main service class.
 */
export class WebSocketConnectionValidator {
  /**
   * Validates if an existing connection should be reused
   * 
   * @param isConnected - Whether socket is currently connected
   * @param currentEmail - Current user email
   * @param newEmail - New user email to connect
   * @param hasClient - Whether client instance exists
   * @returns True if connection should be reused
   */
  static shouldReuseConnection(
    isConnected: boolean,
    currentEmail: string | null,
    newEmail: string,
    hasClient: boolean
  ): boolean {
    return isConnected && currentEmail === newEmail && hasClient;
  }

  /**
   * Validates if user should be switched
   * 
   * @param currentEmail - Current user email
   * @param newEmail - New user email
   * @returns True if user should be switched
   */
  static shouldSwitchUser(
    currentEmail: string | null,
    newEmail: string
  ): boolean {
    return currentEmail !== null && currentEmail !== newEmail;
  }

  /**
   * Validates if connection is currently in progress
   * 
   * @param isConnecting - Whether connection is in progress
   * @param currentEmail - Current user email
   * @param newEmail - New user email
   * @param hasConnectPromise - Whether connect promise exists
   * @returns True if connection is in progress
   */
  static isConnectionInProgress(
    isConnecting: boolean,
    currentEmail: string | null,
    newEmail: string,
    hasConnectPromise: boolean
  ): boolean {
    return isConnecting && currentEmail === newEmail && hasConnectPromise;
  }

  /**
   * Performs all connection validations and returns result
   * 
   * @param params - Validation parameters
   * @returns Validation result object
   */
  static validate(params: {
    isConnected: boolean;
    isConnecting: boolean;
    currentEmail: string | null;
    newEmail: string;
    hasClient: boolean;
    hasConnectPromise: boolean;
  }): IConnectionValidationResult {
    const { isConnected, isConnecting, currentEmail, newEmail, hasClient, hasConnectPromise } =
      params;

    return {
      shouldReuse: this.shouldReuseConnection(
        isConnected,
        currentEmail,
        newEmail,
        hasClient
      ),
      shouldSwitch: this.shouldSwitchUser(currentEmail, newEmail),
      isInProgress: this.isConnectionInProgress(
        isConnecting,
        currentEmail,
        newEmail,
        hasConnectPromise
      ),
    };
  }
}

