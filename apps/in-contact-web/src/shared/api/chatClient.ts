/**
 * @fileoverview Chat API client
 * @summary Client for Teams chat functionality
 * @description Handles getting or creating Teams chat conversations and opening chat windows
 */

import apiClient from './apiClient';
import { config } from '@/shared/config';
import { logError } from '@/shared/utils/logger';
import { ApiError } from '@/shared/errors';
import type { ChatRequest, ChatResponse } from '@/modules/pso-streaming/types/chatTypes';

// Re-export types for convenience
export type { ChatRequest, ChatResponse } from '@/modules/pso-streaming/types/chatTypes';

/**
 * Retrieves or provisions a Teams chat between the current user and another user
 *
 * @param payload - Chat request payload with user email
 * @returns Promise resolving to the chatId string
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const chatId = await getOrCreateChat({ psoEmail: "user@example.com" });
 * ```
 */
export async function getOrCreateChat(payload: ChatRequest): Promise<string> {
  try {
    const res = await apiClient.post<ChatResponse>('/api/GetOrCreateChat', payload);
    return res.data.chatId;
  } catch (error) {
    logError('Failed to get or create chat', { error, payload });
    
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'Failed to get or create chat',
      500,
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Opens a new browser window (or reuses an existing one named "InContactTeamsWindow")
 * pointing at the given Teams chat deep-link
 *
 * @param chatId - The Teams/Graph chatId returned by getOrCreateChat
 *
 * @example
 * ```typescript
 * const chatId = await getOrCreateChat({ psoEmail: "user@example.com" });
 * openChatWindow(chatId);
 * ```
 */
export function openChatWindow(chatId: string): void {
  if (!config.azureAdTenantId) {
    logError(
      'Missing Azure AD tenant ID configuration - cannot open Teams chat',
      { chatId }
    );
    return;
  }

  const url = `https://teams.microsoft.com/l/chat/${encodeURIComponent(
    chatId
  )}/conversations?tenantId=${encodeURIComponent(config.azureAdTenantId)}`;

  // "InContactTeamsWindow" ensures the same window is reused
  window.open(url, 'InContactTeamsWindow');
}

