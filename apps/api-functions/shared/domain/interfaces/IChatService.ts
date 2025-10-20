/**
 * @fileoverview IChatService - Interface for chat operations
 * @description Defines the contract for chat services
 */

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
   * Sends a message to a chat
   * @param token - Authentication token
   * @param chatId - ID of the chat
   * @param message - Message content
   * @returns Promise that resolves when message is sent
   * @throws Error if message sending fails
   */
  sendMessage(token: string, chatId: string, message: any): Promise<void>;

  /**
   * Removes a member from a chat
   * @param token - Authentication token
   * @param chatId - ID of the chat
   * @param userOid - Azure AD Object ID of the user to remove
   * @returns Promise that resolves when member is removed
   * @throws Error if member removal fails
   */
  removeChatMember(token: string, chatId: string, userOid: string): Promise<void>;

  /**
   * Adds a user temporarily to a chat
   * @param token - Authentication token
   * @param chatId - ID of the chat
   * @param userOid - Azure AD Object ID of the user to add
   * @returns Promise that resolves when user is added
   * @throws Error if user addition fails
   */
  addUserToChatTemporarily(token: string, chatId: string, userOid: string): Promise<void>;
}
