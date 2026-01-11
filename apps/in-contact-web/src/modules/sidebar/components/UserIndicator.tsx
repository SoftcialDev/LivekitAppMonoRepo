/**
 * @fileoverview UserIndicator component
 * @summary Displays user status indicator with name
 * @description Renders a colored status circle next to the user's name.
 * Note: Navigation functionality has been removed as video pages are no longer used.
 */

import React from 'react';
import type { IUserIndicatorProps } from './types/sidebarComponentsTypes';

/**
 * UserIndicator component
 * 
 * Displays a small colored status circle next to the user's name.
 * The name is always rendered as non-clickable text.
 * 
 * @param props - Component props
 * @returns JSX element with user indicator
 * 
 * @example
 * ```tsx
 * <UserIndicator
 *   user={userStatus}
 *   bgClass="bg-green-500"
 * />
 * ```
 */
export const UserIndicator: React.FC<IUserIndicatorProps> = ({
  user,
  outerClass = 'w-8 h-8',
  innerClass,
  bgClass = 'bg-[var(--color-secondary)]',
  borderClass = 'border-2 border-[var(--color-primary-dark)]',
  nameClass = 'truncate text-[var(--color-tertiary)] hover:text-[var(--color-secondary-hover)] cursor-default',
}) => {
  const circleSize = innerClass ?? outerClass;

  return (
    <div className="flex items-center space-x-2">
      <span className={`flex items-center justify-center ${outerClass} shrink-0`}>
        <span className={`${circleSize} rounded-full ${bgClass} ${borderClass}`} />
      </span>
      <span className={nameClass}>{user.name}</span>
    </div>
  );
};

