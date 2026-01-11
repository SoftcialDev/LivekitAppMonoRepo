/**
 * @fileoverview Chat type definitions
 * @summary Type definitions for chat functionality
 * @description Defines interfaces and types for Teams chat operations
 */

/**
 * Payload sent to the getOrCreateChat endpoint
 */
export interface ChatRequest {
  /**
   * The email address of the user to chat with
   */
  psoEmail: string;

  /**
   * Optional existing Teams/Graph chatId for this conversation.
   * If provided and found in the database, the same chat will be reused.
   */
  existingChatId?: string | null;
}

/**
 * Response returned by the getOrCreateChat endpoint
 */
export interface ChatResponse {
  /**
   * The canonical Teams/Graph chatId for the conversation.
   * Use this to deep-link into the existing chat.
   */
  chatId: string;
}

/**
 * Return type for useChat hook
 */
export interface IUseChatReturn {
  /**
   * Opens a Teams chat window with the specified user
   * 
   * @param email - User email address to chat with
   */
  handleChat: (email: string) => Promise<void>;
}

