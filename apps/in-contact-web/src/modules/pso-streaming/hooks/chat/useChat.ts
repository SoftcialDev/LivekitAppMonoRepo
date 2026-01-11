/**
 * @fileoverview useChat hook
 * @summary Hook for Teams chat functionality
 * @description Provides callback for initiating Teams chat sessions with users
 */

import { useCallback } from 'react';
import { getOrCreateChat, openChatWindow } from '@/shared/api/chatClient';
import { useToast } from '@/ui-kit/feedback';
import { logError, logInfo } from '@/shared/utils/logger';
import type { IUseChatReturn } from '../../types/chatTypes';

/**
 * Hook for Teams chat actions
 *
 * Exposes callback for opening Teams chat windows:
 * - `handleChat(email)` → opens (or focuses) the Teams chat window for the specified user
 *
 * All failures and successes show toast notifications.
 *
 * @returns Object with chat action handler
 */
export function useChat(): IUseChatReturn {
  const { showToast } = useToast();

  /**
   * Opens (or focuses) the Teams chat window for a user
   *
   * 1. Ensures a chat exists (`getOrCreateChat`)
   * 2. Opens/focuses that Teams window (`openChatWindow`)
   *
   * @param email - User email address to chat with
   * @returns Promise that resolves once the window is opened
   */
  const handleChat = useCallback(
    async (email: string): Promise<void> => {
      try {
        logInfo('Opening chat with user', { email });
        const chatId = await getOrCreateChat({ psoEmail: email });
        openChatWindow(chatId);
        showToast(`Opened chat with ${email}`, 'success');
      } catch (error) {
        logError('Failed to open chat', { error, email });
        showToast(`Failed to open chat with ${email}`, 'error');
      }
    },
    [showToast]
  );

  return { handleChat };
}

