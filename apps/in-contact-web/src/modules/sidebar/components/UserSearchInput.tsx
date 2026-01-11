/**
 * @fileoverview UserSearchInput component
 * @summary Search input for filtering users in the sidebar
 * @description Provides a search input field for filtering users by name or email
 */

import React from 'react';
import type { IUserSearchInputProps } from './types/sidebarComponentsTypes';

/**
 * UserSearchInput component
 * 
 * Renders a search input field styled for the sidebar.
 * 
 * @param props - Component props
 * @returns JSX element with search input
 * 
 * @example
 * ```tsx
 * <UserSearchInput
 *   value={searchTerm}
 *   onChange={handleSearch}
 *   placeholder="Search..."
 * />
 * ```
 */
export const UserSearchInput: React.FC<IUserSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full px-4 py-2
          bg-(--color-primary)
          text-white border border-white rounded-full
          focus:outline-none focus:ring-0
        "
      />
    </div>
  );
};


