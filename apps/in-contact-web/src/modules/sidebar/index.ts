/**
 * @fileoverview Sidebar module barrel export
 * @summary Exports all public API from sidebar module
 * @description Centralized exports for the sidebar module following Screaming Architecture
 */

// Components
export { Sidebar } from './components/Sidebar';
export { UserItem } from './components/UserItem';
export { UserIndicator } from './components/UserIndicator';
export { ChatButton } from './components/ChatButton';
export { SidebarToggle } from './components/SidebarToggle';

// Hooks
export { useSidebar } from './hooks/useSidebar';
export { useSidebarRoleFlags } from './hooks/useSidebarRoleFlags';
export { useSidebarFilters } from './hooks/useSidebarFilters';
export { useSidebarNavigation } from './hooks/useSidebarNavigation';

// Types
export type {
  ISidebarProps,
  IUserItemProps,
  IUserIndicatorProps,
  IChatButtonProps,
  ISidebarToggleProps,
  IUserSearchInputProps,
  IUserListProps,
  ISidebarDashboardSectionProps,
  ISidebarManageSectionProps,
} from './components/types/sidebarComponentsTypes';

export type {
  IUseSidebarRoleFlagsReturn,
  IUseSidebarFiltersReturn,
  IUseSidebarNavigationReturn,
} from './types';

// Constants
export {
  ROLE_OPTIONS,
  SIDEBAR_EXPANDED_WIDTH,
  USER_LIST_SCROLL_CONFIG,
  SIDEBAR_LINK_CLASSES,
  IMPLEMENTED_ROUTES,
  SPECIAL_ACCESS_EMAILS,
} from './constants/sidebarConstants';

// Utils
export {
  shortName,
  filterUsers,
  excludeCurrentUser,
  filterValidOfflineUsers,
  getEffectiveRoleOptions,
  calculateScrollMaxHeight,
} from './utils/sidebarUtils';
export { getCMIndicatorColor, getNameTextColor } from './utils/userItemUtils';

