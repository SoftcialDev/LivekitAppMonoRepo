/**
 * @fileoverview Contact Manager Dashboard routes
 * @summary Defines routes for Contact Manager Dashboard module
 * @description Exports route definitions for Contact Manager Dashboard page
 */

import type { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { ContactManagerDashboardPage } from './pages';
import { UserRole } from '@/modules/auth/enums';

/**
 * Returns route definitions for Contact Manager Dashboard module
 *
 * @returns Array of route objects
 */
export function contactManagerDashboardRoutes(): RouteObject[] {
  return [
    {
      path: '/contactManagerDashboard',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.ContactManager]}>
          <ContactManagerDashboardPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

