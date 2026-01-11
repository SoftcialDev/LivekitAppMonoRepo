/**
 * @fileoverview Sidebar constants
 * @summary Constants for sidebar configuration
 * @description Centralized constants for sidebar operations
 */

import { UserRole } from '@/modules/auth/enums';

/**
 * Role filter options for admins/supervisors view
 */
export const ROLE_OPTIONS = [
  { label: 'All users', value: '' },
  { label: 'Admins', value: UserRole.Admin },
  { label: 'Super Admins', value: UserRole.SuperAdmin },
  { label: 'Supervisors', value: UserRole.Supervisor },
  { label: 'PSOs', value: UserRole.PSO },
  { label: 'Contact Managers', value: UserRole.ContactManager },
] as const;

/**
 * Sidebar width when expanded
 */
export const SIDEBAR_EXPANDED_WIDTH = 'w-[350px]';

/**
 * Sidebar width when collapsed
 */
export const SIDEBAR_COLLAPSED_WIDTH = 'w-0 overflow-hidden';

/**
 * Configuration for user list scrolling
 */
export const USER_LIST_SCROLL_CONFIG = {
  /**
   * Maximum number of items before scrolling is enabled
   */
  MAX_ITEMS_WITHOUT_SCROLL: 5,
  
  /**
   * Maximum height in pixels when scrolling is enabled
   */
  MAX_HEIGHT_PX: 128,
} as const;

/**
 * Navigation link CSS classes
 */
export const SIDEBAR_LINK_CLASSES = {
  /**
   * Base class for navigation links
   */
  BASE: 'block py-2 pl-14 pr-3 rounded-md text-gray-300 hover:text-white',
  
  /**
   * Class for active navigation links
   */
  ACTIVE: 'text-white font-semibold',
  
  /**
   * Class for disabled/non-implemented navigation links
   */
  DISABLED: 'block py-2 pl-14 pr-3 rounded-md text-gray-500 cursor-not-allowed opacity-50',
} as const;

/**
 * Routes that are fully implemented and functional
 */
export const IMPLEMENTED_ROUTES = [
  '/errorLogs',
  '/cameraFailures',
  '/admins',
  '/superAdmins',
  '/contactManagers',
  '/supervisors',
  '/psos',
  '/psos-streaming',
  '/snapshotReport',
  '/recordings',
  '/talkSessions',
] as const;

/**
 * Email patterns for special access to certain routes
 */
export const SPECIAL_ACCESS_EMAILS = {
  /**
   * Email pattern for Error Logs access (included check)
   */
  ERROR_LOGS: 'shanty.cerdas',
  
  /**
   * Email pattern for Camera Failures access (included check)
   */
  CAMERA_FAILURES: 'shanty.cerdas',
} as const;

