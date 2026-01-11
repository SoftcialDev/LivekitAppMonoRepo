/**
 * @fileoverview Navigation type definitions
 * @summary Type definitions for navigation components
 * @description Defines types for navigation-related components like route protection
 */

import type { ReactNode } from 'react';
import type { UserRole } from '@/modules/auth/enums';

/**
 * Props for EmailProtectedRoute component
 */
export interface IEmailProtectedRouteProps {
  /**
   * The element(s) to render if access is allowed
   */
  children: ReactNode;

  /**
   * Email pattern that must be contained in the user's email
   */
  emailPattern: string;
}

/**
 * Props for RoleProtectedRoute component
 */
export interface IRoleProtectedRouteProps {
  /**
   * The element(s) to render if access is allowed
   */
  children: ReactNode;

  /**
   * Array of roles that have access to the route
   */
  allowedRoles: UserRole[];
}

