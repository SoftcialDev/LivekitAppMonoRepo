/**
 * @fileoverview IWebPubSubService - Interface for WebPubSub operations
 * @summary Abstraction for WebPubSub service operations
 * @description Interface defining the contract for WebPubSub service implementations
 */

/**
 * Interface for WebPubSub service operations
 * @description Defines the contract for WebPubSub token generation and messaging
 */
export interface IWebPubSubService {
  /**
   * Generates a client access token for WebPubSub authentication
   * @param userId - The user identifier for the token
   * @param groups - The groups the user should be subscribed to
   * @returns Promise that resolves to the JWT token string
   * @throws Error when token generation fails
   * @example
   * const token = await webPubSubService.generateToken('user@example.com', ['presence', 'user@example.com']);
   */
  generateToken(userId: string, groups: string[]): Promise<string>;

  /**
   * Broadcasts a presence event to all clients in the presence group
   * @param payload - The presence information to broadcast
   * @returns Promise that resolves when the broadcast is complete
   * @throws Error when broadcast fails
   * @example
   * await webPubSubService.broadcastPresence({
   *   email: 'user@example.com',
   *   fullName: 'John Doe',
   *   status: 'online',
   *   lastSeenAt: '2023-01-01T00:00:00Z'
   * });
   */
  broadcastPresence(payload: {
    email: string;
    fullName: string;
    status: "online" | "offline";
    lastSeenAt: string;
    role?: string;
    supervisorId?: string | null;
    supervisorEmail?: string | null;
  }): Promise<void>;

  /**
   * Broadcasts a custom message to all clients in a specific group
   * @param group - The group to broadcast to
   * @param message - The message to broadcast
   * @returns Promise that resolves when the broadcast is complete
   * @throws Error when broadcast fails
   * @example
   * await webPubSubService.broadcastMessage('presence', {
   *   type: 'contactManagerStatusChange',
   *   contactManager: { email: 'cm@example.com', status: 'Available' }
   * });
   */
  broadcastMessage(group: string, message: any): Promise<void>;

  /**
   * Lists all groups and users with detailed connection information
   * @returns Promise that resolves when listing is complete
   * @throws Error when listing fails
   */
  listAllGroupsAndUsers(): Promise<void>;

  /**
   * Gets the list of active users connected to the 'presence' group
   * @returns Promise that resolves to array of active users
   * @throws Error when retrieval fails
   */
  getActiveUsersInPresenceGroup(): Promise<Array<{ userId: string; userRoles: string[] }>>;

  /**
   * Syncs all users between Web PubSub and Database
   * @returns Promise that resolves to sync results
   * @throws Error when sync fails
   */
  syncAllUsersWithDatabase(): Promise<{
    corrected: number;
    warnings: string[];
    errors: string[];
  }>;

  /**
   * Logs active users in the presence group and compares with database
   * @returns Promise that resolves when logging is complete
   * @throws Error when logging fails
   */
  logActiveUsersInPresenceGroup(): Promise<void>;

  /**
   * Debug function to test sync functionality with detailed logging
   * @returns Promise that resolves to sync results with debug information
   * @throws Error when debug sync fails
   */
  debugSync(): Promise<{
    corrected: number;
    warnings: string[];
    errors: string[];
    webPubSubUsers: string[];
    dbUsers: Array<{ email: string; status: string }>;
  }>;

  /**
   * Broadcasts supervisor change notifications to all users in the presence group
   * @param payload - The supervisor change notification data
   * @returns Promise that resolves when the broadcast is complete
   * @throws Error when broadcast fails
   * @example
   * await webPubSubService.broadcastSupervisorChangeNotification({
   *   psoEmails: ['pso1@example.com', 'pso2@example.com'],
   *   oldSupervisorEmail: 'old@example.com',
   *   newSupervisorEmail: 'new@example.com',
   *   psoNames: ['PSO One', 'PSO Two'],
   *   newSupervisorName: 'New Supervisor'
   * });
   */
  broadcastSupervisorChangeNotification(payload: {
    psoEmails: string[];
    oldSupervisorEmail?: string;
    newSupervisorEmail: string;
    newSupervisorId?: string;
    psoNames: string[];
    newSupervisorName: string;
  }): Promise<void>;
}