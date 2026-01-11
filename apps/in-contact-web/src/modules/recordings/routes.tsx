/**
 * @fileoverview Routes for recordings module
 * @summary Recording routes configuration
 * @description Defines all routes related to recording reports.
 * Returns an array of route configuration objects for use with createBrowserRouter.
 */

import type { RouteObject } from 'react-router-dom';
import { RecordingReportPage } from './pages/RecordingReportPage';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { UserRole } from '@/modules/auth/enums';

/**
 * Returns route configuration objects for the recordings module
 * 
 * These routes are protected by role-based access control:
 * - /recordings - Admin and SuperAdmin roles
 * 
 * They should be composed within a layout (e.g., DashboardLayout) in AppRouter.
 * 
 * @returns Array of route configuration objects
 */
export function recordingRoutes(): RouteObject[] {
  return [
    {
      path: '/recordings',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.Admin, UserRole.SuperAdmin]}>
          <RecordingReportPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

