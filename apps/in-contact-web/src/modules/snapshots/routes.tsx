/**
 * @fileoverview Routes for snapshots module
 * @summary Snapshot routes configuration
 * @description Defines all routes related to snapshot reports.
 * Returns an array of route configuration objects for use with createBrowserRouter.
 */

import type { RouteObject } from 'react-router-dom';
import { SnapshotReportPage } from './pages/SnapshotReportPage';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { UserRole } from '@/modules/auth/enums';

/**
 * Returns route configuration objects for the snapshots module
 * 
 * These routes are protected by role-based access control:
 * - /snapshotReport - Admin and SuperAdmin roles
 * 
 * They should be composed within a layout (e.g., DashboardLayout) in AppRouter.
 * 
 * @returns Array of route configuration objects
 */
export function snapshotRoutes(): RouteObject[] {
  return [
    {
      path: '/snapshotReport',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.Admin, UserRole.SuperAdmin]}>
          <SnapshotReportPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

