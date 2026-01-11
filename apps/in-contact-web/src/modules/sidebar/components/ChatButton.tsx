/**
 * @fileoverview ChatButton component
 * @summary Button for initiating chat with a user
 */

import React from 'react';
import { ChatIcon } from '@/ui-kit/icons';
import type { IChatButtonProps } from './types/sidebarComponentsTypes';

/**
 * ChatButton component
 * 
 * Renders a button for initiating a chat session with a user.
 * Includes a chat icon and label for accessibility.
 * 
 * @param props - Component props
 * @returns JSX element with chat button
 * 
 * @example
 * ```tsx
 * <ChatButton
 *   userEmail="user@example.com"
 *   userName="John Doe"
 *   onChat={(email) => handleChat(email)}
 * />
 * ```
 */
export const ChatButton: React.FC<IChatButtonProps> = ({
  userEmail,
  userName,
  onChat,
}) => (
  <button
    type="button"
    onClick={() => onChat(userEmail)}
    className="
      flex items-center space-x-1
      px-2 py-1
      bg-transparent hover:bg-[rgba(255,255,255,0.1)]
      rounded cursor-pointer transition-colors
    "
    aria-label={`Open chat with ${userName ?? userEmail}`}
  >
    <ChatIcon className="w-6 h-6" />
    <span className="text-[var(--color-tertiary)]">Chat</span>
  </button>
);

