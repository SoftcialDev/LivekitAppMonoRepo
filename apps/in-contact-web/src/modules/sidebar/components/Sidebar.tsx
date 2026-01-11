/**
 * @fileoverview Sidebar component
 * @summary Main sidebar component with user presence, search, and navigation
 * @description Sidebar component that displays users with real-time presence,
 * search and role filtering, and navigation based on user role.
 * 
 * For Admin/Supervisor/SuperAdmin:
 * - Shows standard navigation (Manage, PSOs Streaming) and all presence users
 * - Optional role filter and search
 * 
 * For PSO:
 * - Shows only their Contact Managers (with availability status)
 * - Role dropdown is locked to "Contact Managers"
 */

import React from 'react';
import { IconWithLabel } from '@/ui-kit/layout';
import { Dropdown } from '@/ui-kit/dropdown';
import monitorIcon from '@/shared/assets/icon-monitor.png';
import { useAuth } from '@/modules/auth';
import { useUserInfo } from '@/modules/auth/stores/user-info-store';
import { useChat } from '@/modules/pso-streaming';
import { SIDEBAR_EXPANDED_WIDTH } from '../constants/sidebarConstants';
import type { ISidebarProps } from './types/sidebarComponentsTypes';
import { useSidebarRoleFlags } from '../hooks/useSidebarRoleFlags';
import { useSidebarFilters } from '../hooks/useSidebarFilters';
import { useSidebarNavigation } from '../hooks/useSidebarNavigation';
import { useEnrichedUsers } from '../hooks/useEnrichedUsers';
import { SidebarLogo } from './SidebarLogo';
import { SidebarManageSection } from './SidebarManageSection';
import { SidebarDashboardSection } from './SidebarDashboardSection';
import { UserSearchInput } from './UserSearchInput';
import { UserList } from './UserList';

/**
 * Sidebar component
 * 
 * Main sidebar component that displays:
 * - Logo header
 * - Navigation based on user role (Admin/Supervisor/SuperAdmin vs PSO)
 * - Search input for filtering users
 * - Role filter dropdown
 * - Lists of online and offline users with dynamic scroll
 * 
 * @param props - Component props
 * @returns JSX element with sidebar
 */
export const Sidebar: React.FC<ISidebarProps> = ({
  onlineUsers,
  offlineUsers,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const { handleChat } = useChat();
  const currentEmail = account?.username ?? '';
  const currentRole = userInfo?.role ?? null;

  // Compute role flags
  const { isAdmin, isSupervisor, isSuperAdmin, isPso } = useSidebarRoleFlags(currentRole);

  // Enrich users with Contact Manager status (for Admin/Supervisor/SuperAdmin and PSO)
  // PSOs need CM status to see colored indicators for their Contact Managers
  const shouldFetchCMStatus = isAdmin || isSupervisor || isSuperAdmin || isPso;
  const { enrichedOnlineUsers, enrichedOfflineUsers } = useEnrichedUsers(
    onlineUsers,
    offlineUsers,
    {
      shouldFetch: shouldFetchCMStatus,
      userEmail: currentEmail,
    }
  );

  // Navigation helper
  const { renderNavLink } = useSidebarNavigation();

  // Filter state and filtered lists (excludes current user automatically)
  const {
    searchTerm,
    roleFilter,
    effectiveRoleOptions,
    filteredOnline,
    filteredOffline,
    handleSearch,
    handleRoleFilterChange,
  } = useSidebarFilters(enrichedOnlineUsers, enrichedOfflineUsers, isPso, currentEmail);

  // Show navigation sections for Admin/Supervisor/SuperAdmin only
  const showNavigation = isAdmin || isSupervisor || isSuperAdmin;

  // Show empty state when no users match filters
  const showEmptyState = filteredOnline.length === 0 && filteredOffline.length === 0;

  return (
    <aside
      className={`
        relative flex flex-col bg-(--color-primary) text-white
        border-r border-black transition-all duration-300
        ${isCollapsed ? 'w-0 overflow-hidden' : SIDEBAR_EXPANDED_WIDTH}
      `}
    >
      <SidebarLogo />

      <nav className="flex-1 overflow-y-auto">
        {/* Navigation sections (hidden for PSO) */}
        {showNavigation && (
          <>
            <SidebarManageSection
              isSuperAdmin={isSuperAdmin}
              isAdmin={isAdmin}
              isSupervisor={isSupervisor}
              currentEmail={currentEmail}
              renderNavLink={renderNavLink}
            />

            <SidebarDashboardSection renderNavLink={renderNavLink} />
          </>
        )}

        {/* Filters + Lists */}
        <div className="px-6 py-4">
          {/* Users section header */}
          <IconWithLabel
            src={monitorIcon}
            alt="Users"
            imgSize="h-4 w-4"
            textSize="text-xs font-semibold"
            className="flex items-center mb-2"
          >
            Users
          </IconWithLabel>

          {/* Search input */}
          <UserSearchInput value={searchTerm} onChange={handleSearch} />

          {/* Role filter dropdown */}
          <div className="mb-2">
            <Dropdown
              options={effectiveRoleOptions.map((r) => ({
                label: r.label,
                value: r.value,
              }))}
              value={roleFilter}
              onSelect={handleRoleFilterChange}
              className="w-full"
              buttonClassName="w-full text-left text-sm bg-[var(--color-tertiary)]"
              menuClassName="bg-[var(--color-tertiary)] text-sm w-72 ml-6"
            />
          </div>

          {/* User lists */}
          {filteredOnline.length > 0 && (
            <UserList
              title={`Online (${filteredOnline.length})`}
              users={filteredOnline}
              onChat={handleChat}
            />
          )}

          {filteredOffline.length > 0 && (
            <UserList
              title={`Offline (${filteredOffline.length})`}
              users={filteredOffline}
              onChat={handleChat}
            />
          )}

          {/* Empty state */}
          {showEmptyState && (
            <div className="text-xs font-semibold text-(--color-tertiary) text-center py-4">
              No users found
            </div>
          )}
        </div>
      </nav>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-primary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-secondary);
          border-radius: 4px;
          border: 1px solid var(--color-primary);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-tertiary);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: var(--color-primary);
        }
      `}</style>
    </aside>
  );
};
