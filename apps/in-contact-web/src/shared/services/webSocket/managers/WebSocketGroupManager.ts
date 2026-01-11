/**
 * @fileoverview WebSocket group manager
 * @summary Manages WebSocket group membership
 * @description Handles joining and leaving WebSocket groups, with memory of joined groups
 */

import { logWarn, logDebug } from '@/shared/utils/logger';
import type { WebPubSubClient } from '@azure/web-pubsub-client';

/**
 * WebSocket group manager
 * 
 * Manages group membership operations including:
 * - Joining groups
 * - Leaving groups
 * - Remembering groups for rejoin on reconnect
 */
export class WebSocketGroupManager {
  /**
   * Set of groups that should be rejoined on reconnect
   */
  private readonly joinedGroups = new Set<string>();

  /**
   * Gets all remembered groups
   * 
   * @returns Set of group names
   */
  getGroups(): ReadonlySet<string> {
    return this.joinedGroups;
  }

  /**
   * Adds a group to the remembered set
   * 
   * @param groupName - Group name to remember
   */
  rememberGroup(groupName: string): void {
    const normalized = groupName.trim().toLowerCase();
    this.joinedGroups.add(normalized);
  }

  /**
   * Removes a group from the remembered set
   * 
   * @param groupName - Group name to forget
   */
  forgetGroup(groupName: string): void {
    const normalized = groupName.trim().toLowerCase();
    this.joinedGroups.delete(normalized);
  }

  /**
   * Clears all remembered groups
   */
  clearGroups(): void {
    this.joinedGroups.clear();
  }

  /**
   * Joins a WebSocket group and remembers it for future reconnects
   * 
   * @param client - WebPubSub client instance
   * @param groupName - Group name to join
   * @returns Promise that resolves when group is joined
   */
  async joinGroup(client: WebPubSubClient, groupName: string): Promise<void> {
    const normalized = groupName.trim().toLowerCase();

    // Remember group for future reconnects
    this.rememberGroup(normalized);

    try {
      await client.joinGroup(normalized);
      logDebug('Joined WebSocket group', { group: normalized });
    } catch (error) {
      logWarn('Error joining group', { group: normalized, error });
      throw error;
    }
  }

  /**
   * Leaves a WebSocket group and removes it from memory
   * 
   * @param client - WebPubSub client instance
   * @param groupName - Group name to leave
   * @returns Promise that resolves when group is left
   */
  async leaveGroup(client: WebPubSubClient, groupName: string): Promise<void> {
    const normalized = groupName.trim().toLowerCase();

    // Forget group
    this.forgetGroup(normalized);

    try {
      await client.leaveGroup(normalized);
      logDebug('Left WebSocket group', { group: normalized });
    } catch (error) {
      logWarn('Error leaving group', { group: normalized, error });
    }
  }

  /**
   * Rejoins all remembered groups after a reconnect
   * 
   * @param client - WebPubSub client instance
   * @returns Promise that resolves when all groups are rejoined
   */
  async rejoinAllGroups(client: WebPubSubClient): Promise<void> {
    const groups = Array.from(this.joinedGroups);

    for (const group of groups) {
      try {
        await client.joinGroup(group);
        logDebug('Rejoined WebSocket group', { group });
      } catch (error) {
        logWarn('Error rejoining group', { group, error });
        // Continue with other groups even if one fails
      }
    }
  }

  /**
   * Leaves all groups during cleanup
   * 
   * @param client - WebPubSub client instance
   * @returns Promise that resolves when all groups are left
   */
  async leaveAllGroups(client: WebPubSubClient): Promise<void> {
    const groups = Array.from(this.joinedGroups);

    for (const group of groups) {
      try {
        await client.leaveGroup(group);
        logDebug('Left WebSocket group during cleanup', { group });
      } catch (error) {
        logWarn('Error leaving group during cleanup', { group, error });
        // Continue with other groups even if one fails
      }
    }

    this.clearGroups();
  }
}

