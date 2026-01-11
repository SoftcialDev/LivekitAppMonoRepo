/**
 * @fileoverview ChatButton component
 * @summary Button component for initiating chat
 * @description Reusable button for chat actions in video cards
 */

import React from 'react';
import type { IChatButtonProps } from '../types/buttonTypes';

/**
 * Button component for initiating chat
 */
export const ChatButton: React.FC<IChatButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-2 bg-(--color-secondary) text-(--color-primary-dark) rounded-xl disabled:opacity-50 ${className}`}
    >
      Chat
    </button>
  );
};

