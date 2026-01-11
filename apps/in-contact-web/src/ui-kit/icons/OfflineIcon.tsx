/**
 * @fileoverview OfflineIcon component
 * @summary Icon indicating user is offline
 */

import React from 'react';
import type { IIconProps } from './types/iconTypes';

/**
 * OfflineIcon component
 * 
 * Displays an offline indicator icon (crossed-out circle).
 * Used to visually indicate that a user is currently offline.
 * 
 * @param props - Icon props
 * @returns JSX element with offline icon
 * 
 * @example
 * ```tsx
 * <OfflineIcon className="w-6 h-6" />
 * ```
 */
export const OfflineIcon: React.FC<IIconProps> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="var(--color-tertiary)"
      fillRule="evenodd"
      d="M5.781 4.414a7 7 0 019.62 10.039l-9.62-10.04zm-1.408 1.42a7 7 0 009.549 9.964L4.373 5.836zM10 1a9 9 0 100 18 9 9 0 000-18z"
      clipRule="evenodd"
    />
  </svg>
);

