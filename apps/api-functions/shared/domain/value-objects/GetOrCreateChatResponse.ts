/**
 * @fileoverview GetOrCreateChatResponse - Value object for chat creation responses
 * @summary Encapsulates chat creation response data
 * @description Value object representing the response after creating or getting a chat
 */

/**
 * Value object representing a chat creation response
 * @description Encapsulates the chat ID
 */
export class GetOrCreateChatResponse {
  /**
   * Creates a new GetOrCreateChatResponse instance
   * @param chatId - The ID of the created or retrieved chat
   */
  constructor(
    public readonly chatId: string
  ) {}

  /**
   * Converts the response to a plain object for API response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      chatId: this.chatId
    };
  }
}
