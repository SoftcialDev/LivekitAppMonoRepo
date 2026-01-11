/**
 * @fileoverview Routes for talk-sessions module
 * @summary Talk session routes configuration
 * @description Defines all routes related to talk session reports.
 * Returns an array of route configuration objects for use with createBrowserRouter.
 */

import type { RouteObject } from 'react-router-dom';
import { TalkSessionsReportPage } from './pages/TalkSessionsReportPage';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { UserRole } from '@/modules/auth/enums';

/**
 * Returns route configuration objects for the talk-sessions module
 * 
 * These routes are protected by role-based access control:
 * - /talkSessions - Admin and SuperAdmin roles
 * 
 * They should be composed within a layout (e.g., DashboardLayout) in AppRouter.
 * 
 * @returns Array of route configuration objects
 */
export function talkSessionsRoutes(): RouteObject[] {
  return [
    {
      path: '/talkSessions',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.Admin, UserRole.SuperAdmin]}>
          <TalkSessionsReportPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

