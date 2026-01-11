/**
 * @fileoverview UserItem component
 * @summary Single user row in the sidebar
 * @description Renders a user with presence indicator and chat button
 */

import React from 'react';
import { UserIndicator } from './UserIndicator';
import { ChatButton } from './ChatButton';
import { OfflineIcon } from '@/ui-kit/icons';
import { PresenceStatus } from '@/modules/presence/enums';
import type { IUserItemProps } from './types/sidebarComponentsTypes';
import { getCMIndicatorColor, getNameTextColor } from '../utils/userItemUtils';

/**
 * UserItem component
 * 
 * Renders a single row for a user with:
 * - Presence badge + name (non-clickable)
 * - A "Chat" action on the right
 * 
 * Contact Managers get a color-coded indicator while online:
 * - Available → green
 * - OnBreak → amber
 * - OnAnotherTask → blue
 * - Unavailable → red (not the offline icon)
 * 
 * Truly offline users show the gray offline pill and tertiary text.
 * 
 * @param props - Component props
 * @returns JSX element with user item
 * 
 * @example
 * ```tsx
 * <UserItem
 *   user={userStatus}
 *   onChat={(email) => handleChat(email)}
 * />
 * ```
 */
export const UserItem: React.FC<IUserItemProps> = ({
  user,
  onChat,
}) => {
  const isOnline = user.status === PresenceStatus.Online;
  const nameClass = getNameTextColor(user.status);
  const indicatorBgClass = getCMIndicatorColor(user.status, user.cmStatus);

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <UserIndicator
            user={user}
            outerClass="w-8 h-8"
            innerClass="w-4 h-4"
            bgClass={indicatorBgClass}
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass={`${nameClass} hover:text-[var(--color-secondary-hover)]`}
          />
        ) : (
          <>
            <span className="w-6 h-6 flex-shrink-0" aria-hidden="true">
              <OfflineIcon />
            </span>
            <span className={nameClass}>
              {user.name}
            </span>
          </>
        )}
      </div>

      <ChatButton
        userEmail={user.email}
        userName={user.name}
        onChat={onChat}
      />
    </div>
  );
};

