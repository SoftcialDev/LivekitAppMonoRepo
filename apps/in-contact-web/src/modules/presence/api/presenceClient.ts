/**
 * @fileoverview Presence client for status updates
 * @summary Client for updating user presence status
 * @description Handles updating the authenticated user's presence status on the server
 */

import apiClient from '@/shared/api/apiClient';
import { logError } from '@/shared/utils/logger';
import { PresenceUpdateError } from '../errors';
import { PresenceStatus } from '../enums/presenceEnums';

/**
 * Client for updating the employee's presence status on the server
 * 
 * Calls the PresenceUpdate endpoint to mark the user as online or offline.
 * This is typically called when the application starts or stops streaming,
 * or when the WebSocket connection is established.
 */
export class PresenceClient {
  /**
   * Marks the authenticated user as online
   * 
   * @returns Promise that resolves when the update is complete
   * @throws {PresenceUpdateError} if the request fails
   * 
   * @example
   * ```typescript
   * const client = new PresenceClient();
   * try {
   *   await client.setOnline();
   * } catch (error) {
   *   if (error instanceof PresenceUpdateError) {
   *     // Handle error
   *   }
   * }
   * ```
   */
  async setOnline(): Promise<void> {
    try {
      await apiClient.post('/api/PresenceUpdate', { status: PresenceStatus.Online });
    } catch (error: unknown) {
      logError('Failed to set user online', { error });

      if (error instanceof Error) {
        throw new PresenceUpdateError('Failed to set user online', error);
      }

      throw new PresenceUpdateError('Failed to set user online');
    }
  }

  /**
   * Marks the authenticated user as offline
   * 
   * @returns Promise that resolves when the update is complete
   * @throws {PresenceUpdateError} if the request fails
   * 
   * @example
   * ```typescript
   * const client = new PresenceClient();
   * try {
   *   await client.setOffline();
   * } catch (error) {
   *   if (error instanceof PresenceUpdateError) {
   *     // Handle error
   *   }
   * }
   * ```
   */
  async setOffline(): Promise<void> {
    try {
      await apiClient.post('/api/PresenceUpdate', { status: PresenceStatus.Offline });
    } catch (error: unknown) {
      logError('Failed to set user offline', { error });

      if (error instanceof Error) {
        throw new PresenceUpdateError('Failed to set user offline', error);
      }

      throw new PresenceUpdateError('Failed to set user offline');
    }
  }
}

