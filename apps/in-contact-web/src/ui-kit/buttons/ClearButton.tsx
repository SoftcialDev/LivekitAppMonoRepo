/**
 * @fileoverview ClearButton - Button for clearing selections
 * @summary Icon button for clearing selections or resetting state
 * @description Reusable clear/close button with X icon for use in inputs and dropdowns
 */

import React from 'react';
import type { IClearButtonProps } from './types';

/**
 * ClearButton component
 * 
 * Renders an icon button with an X symbol for clearing selections or resetting state.
 * Commonly used in search inputs and dropdowns.
 * 
 * @param props - Component props
 * @returns A styled clear/close button
 */
export const ClearButton: React.FC<IClearButtonProps> = ({
  onClick,
  title = 'Clear',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors ${className}`}
      title={title}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
};

