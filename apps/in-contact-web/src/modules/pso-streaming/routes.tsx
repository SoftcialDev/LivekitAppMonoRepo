/**
 * @fileoverview PSO Streaming routes
 * @summary Route definitions for PSO streaming module
 * @description Defines routes for PSO streaming functionality
 */

import type { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '@/ui-kit/navigation';
import { UserRole } from '@/modules/auth/enums';
import { PSOsStreamingPage } from './pages';

/**
 * Returns route objects for PSO streaming module
 * @returns Array of route objects
 */
export function psoStreamingRoutes(): RouteObject[] {
  return [
    {
      path: '/psos-streaming',
      element: (
        <RoleProtectedRoute allowedRoles={[UserRole.Admin, UserRole.SuperAdmin, UserRole.Supervisor]}>
          <PSOsStreamingPage />
        </RoleProtectedRoute>
      ),
    },
  ];
}

