/**
 * @fileoverview Routes for user management module
 * @summary User management routes configuration
 * @description Defines all routes related to user management (Admin, SuperAdmin, Supervisor, PSO, ContactManager).
 * Returns an array of route configuration objects for use with createBrowserRouter.
 */

import type { RouteObject } from 'react-router-dom';
import { AdminPage, SuperAdminPage, ContactManagerPage, SupervisorPage, PsoPage } from './pages';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { UserRole } from '@/modules/auth/enums';

/**
 * Returns route configuration objects for the user management module
 * 
 * These routes are protected by role-based access control:
 * - /admins - Only SuperAdmin role
 * - /superAdmins - Only SuperAdmin role
 * - /contactManagers - Only SuperAdmin role
 * - /supervisors - SuperAdmin, Admin, and Supervisor roles
 * 
 * They should be composed within a layout (e.g., DashboardLayout) in AppRouter.
 * 
 * @returns Array of route configuration objects
 */
export function userManagementRoutes(): RouteObject[] {
  return [
    {
      path: '/admins',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin]}>
          <AdminPage />
        </RoleProtectedRoute>
      ),
    },
    {
      path: '/superAdmins',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin]}>
          <SuperAdminPage />
        </RoleProtectedRoute>
      ),
    },
    {
      path: '/contactManagers',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin]}>
          <ContactManagerPage />
        </RoleProtectedRoute>
      ),
    },
    {
      path: '/supervisors',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Supervisor]}>
          <SupervisorPage />
        </RoleProtectedRoute>
      ),
    },
    {
      path: '/psos',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin, UserRole.Supervisor]}>
          <PsoPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

