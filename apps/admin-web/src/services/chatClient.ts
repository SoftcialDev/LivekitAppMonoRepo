/**
 * @file
 * CRUD client for Chat endpoints in the InContactApp.
 *
 * Endpoints:
 *  - POST /api/getOrCreateChat
 *      → `{ chatId: string }`
 */

import apiClient from "./apiClient";

//
// Data Types
//

/**
 * Payload sent to the getOrCreateChat endpoint.
 */
export interface ChatRequest {
  /**
   * The email address of the PSO to chat with.
   */
  psoEmail: string;

  /**
   * (Optional) An existing Teams/Graph chatId for this conversation.
   * If provided and found in the database, the same chat will be reused.
   */
  existingChatId?: string | null;
}

/**
 * Response returned by the getOrCreateChat endpoint.
 */
export interface ChatResponse {
  /**
   * The canonical Teams/Graph chatId for the conversation.
   * Use this to deep-link into the existing chat.
   */
  chatId: string;
}

//
// API Functions
//

/**
 * Retrieves or provisions a Teams chat between the current user and a PSO.
 *
 * @param payload.psoEmail
 *   The PSO’s email address to initiate the chat with.
 *
 * @param payload.existingChatId
 *   (Optional) If you already know the chatId, you may pass it here
 *   to attempt a quick lookup/reuse. Pass `null` or omit to let
 *   the server search by participants/topic or create a new chat.
 *
 * @returns Promise resolving to the `chatId` string.
 *
 * @example
 * ```ts
 * // 1) First time: no existingChatId
 * const chatId = await getOrCreateChat({ psoEmail: "pso@example.com" });
 *
 * // 2) Store chatId in your UI state, then reuse:
 * const sameChatId = await getOrCreateChat({
 *   psoEmail: "pso@example.com",
 *   existingChatId: chatId
 * });
 * ```
 */
export async function getOrCreateChat(
  payload: ChatRequest
): Promise<string> {
  const res = await apiClient.post<ChatResponse>(
    "/api/GetOrCreateChat",
    payload
  );
  return res.data.chatId;
}

/**
 * Opens a new browser window (or reuses an existing one named "InContactTeamsWindow")
 * pointing at the given Teams chat deep-link.
 *
 * @param chatId
 *   The Teams/Graph chatId returned by getOrCreateChat.
 *
 * @example
 * ```ts
 * const chatId = await getOrCreateChat({ psoEmail: "pso@example.com" });
 * openChatWindow(chatId);
 * ```
 */
export function openChatWindow(chatId: string): void {
  const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID;
  if (!tenantId) {
    console.error(
      "Missing environment variable VITE_AZURE_AD_TENANT_ID – cannot open Teams chat"
    );
    return;
  }

  const url = `https://teams.microsoft.com/l/chat/${encodeURIComponent(
    chatId
  )}/conversations?tenantId=${encodeURIComponent(tenantId)}`;

  // "InContactTeamsWindow" ensures the same window is reused
  window.open(url, "InContactTeamsWindow");
}
