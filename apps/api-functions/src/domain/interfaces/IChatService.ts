/**
 * @fileoverview IChatService - Interface for chat operations
 * @description Defines the contract for chat services
 */

import { BaseChatMessage } from '../types/MessageTypes';

/**
 * Interface for chat service
 */
export interface IChatService {
  /**
   * Gets or creates a chat for contact managers
   * @param token - Authentication token
   * @returns Promise that resolves to chat ID
   * @throws Error if chat operation fails
   */
  getOrSyncChat(token: string): Promise<string>;

  /**
   * Gets or creates a chat between specific participants
   * @param token - Authentication token
   * @param participants - Array of chat participants
   * @param topic - Chat topic/title
   * @returns Promise that resolves to chat ID
   * @throws Error if chat operation fails
   */
  getOrSyncChat(token: string, participants: Array<{ userId: string; azureAdObjectId: string }>, topic: string): Promise<string>;

  /**
   * Gets the Contact Managers chat ID ensuring SuperAdmin-only membership
   * @returns Promise that resolves to chat ID
   */
  getContactManagersChatId(): Promise<string>;

  /**
   * Gets the Snapshot Reports chat ID ensuring SuperAdmin-only membership
   * @returns Promise that resolves to chat ID
   */
  getSnapshotReportsChatId(): Promise<string>;

  /**
   * Sends a message to a chat using the managed service account
   * @param chatId - ID of the chat
   * @param message - Message content (must include type and subject)
   * @returns Promise that resolves when message is sent
   */
  sendMessageAsApp(chatId: string, message: BaseChatMessage): Promise<void>;
}
