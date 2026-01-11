/**
 * @fileoverview ChatIcon component
 * @summary Microsoft Teams-style chat icon
 * @description SVG icon for chat functionality
 */

import React from 'react';
import type { IIconProps } from './types/iconTypes';

/**
 * ChatIcon component
 * 
 * Microsoft Teams-style brand chat icon.
 * 
 * @param props - Icon props
 * @returns JSX element with chat icon
 */
export const ChatIcon: React.FC<IIconProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-tertiary)"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 7h10v10h-10z" />
      <path d="M6 10h4" />
      <path d="M8 10v4" />
      <path d="M8.104 17c.47 2.274 2.483 4 4.896 4a5 5 0 0 0 5 -5v-7h-5" />
      <path d="M18 18a4 4 0 0 0 4 -4v-5h-4" />
      <path d="M13.003 8.83a3 3 0 1 0 -1.833 -1.833" />
      <path d="M15.83 8.36a2.5 2.5 0 1 0 .594 -4.117" />
    </svg>
  );
};

