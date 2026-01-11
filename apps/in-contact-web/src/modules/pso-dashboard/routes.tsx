/**
 * @fileoverview PSO Dashboard routes
 * @summary Route definitions for PSO Dashboard module
 * @description Defines routes for PSO Dashboard page
 */

import type { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { UserRole } from '@/modules/auth/enums';
import PsoDashboardPage from './pages/PsoDashboardPage';

/**
 * Returns route definitions for PSO Dashboard module
 *
 * @returns Array of RouteObject configurations
 */
export function psoDashboardRoutes(): RouteObject[] {
  return [
    {
      path: '/psosDashboard',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.PSO]}>
          <PsoDashboardPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

