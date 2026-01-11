/**
 * @fileoverview Routes for error logs module
 * @summary Error logs routes configuration
 * @description Defines all routes related to error logs management.
 * Returns an array of route configuration objects for use with createBrowserRouter.
 */

import type { RouteObject } from 'react-router-dom';
import { ErrorLogsPage } from './pages/ErrorLogsPage';
import { EmailProtectedRoute } from '@/ui-kit/navigation';

/**
 * Returns route configuration objects for the error logs module
 * 
 * These routes are protected by email pattern restriction (only for specific admin users).
 * They should be composed within a layout (e.g., DashboardLayout) in AppRouter.
 * 
 * @returns Array of route configuration objects
 */
export function errorLogsRoutes(): RouteObject[] {
  return [
    {
      path: '/errorLogs',
      element: (
        <EmailProtectedRoute emailPattern="shanty.cerdas">
          <ErrorLogsPage />
        </EmailProtectedRoute>
      ),
    },
  ];
}

