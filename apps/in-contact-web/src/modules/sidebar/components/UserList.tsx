/**
 * @fileoverview UserList component
 * @summary Scrollable list of users with dynamic height
 * @description Renders a scrollable list of users with automatic height calculation
 */

import React from 'react';
import { UserItem } from './UserItem';
import { calculateScrollMaxHeight, shortName } from '../utils/sidebarUtils';
import { USER_LIST_SCROLL_CONFIG } from '../constants/sidebarConstants';
import type { IUserListProps } from './types/sidebarComponentsTypes';

/**
 * UserList component
 * 
 * Renders a scrollable list of users with dynamic height based on the number of items.
 * If the list has 5 or fewer items, it displays at full height (auto).
 * Otherwise, it limits the height to 128px and enables scrolling.
 * 
 * @param props - Component props
 * @returns JSX element with user list
 * 
 * @example
 * ```tsx
 * <UserList
 *   title="Online (10)"
 *   users={onlineUsers}
 *   onChat={handleChat}
 * />
 * ```
 */
export const UserList: React.FC<IUserListProps> = ({
  title,
  users,
  onChat,
}) => {
  const maxHeight = calculateScrollMaxHeight(
    users.length,
    USER_LIST_SCROLL_CONFIG.MAX_ITEMS_WITHOUT_SCROLL,
    USER_LIST_SCROLL_CONFIG.MAX_HEIGHT_PX
  );

  return (
    <div className="mb-4">
      <div className="text-xs font-semibold mb-2">
        {title}
      </div>
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{
          maxHeight,
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-secondary) var(--color-primary)',
          msOverflowStyle: 'scrollbar',
        }}
      >
        {users.map((user) => {
          const displayName = shortName(user);

          return (
            <UserItem
              key={user.email}
              user={{
                ...user,
                fullName: displayName,
                name: displayName,
              }}
              onChat={onChat}
            />
          );
        })}
      </div>
    </div>
  );
};


