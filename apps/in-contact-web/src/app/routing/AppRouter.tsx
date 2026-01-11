/**
 * @fileoverview AppRouter - Application routing configuration
 * @summary Central routing configuration for the web app
 * @description Application entry point and router.
 * Composes module routes using React Router Data API (createBrowserRouter).
 * 
 * Responsibilities:
 * - Bootstraps authentication (AuthProvider) and toast notifications (ToastProvider)
 * - Registers a token getter with the API client after auth is ready
 * - Declares all routes with role-based access control
 * - Groups UI under a shared DashboardLayout via nested routes
 * 
 * Routes:
 * - Public: `/login`, `/loading`
 * - Protected (under DashboardLayout): `/errorLogs` (email-protected)
 */

import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/modules/auth';
import { ToastProvider } from '@/ui-kit/feedback';
import { WebSocketProvider } from '@/app/providers/WebSocketProvider';
import { setTokenGetter } from '@/shared/api/apiClient';
import { logDebug } from '@/shared/utils/logger';
import { DashboardLayout } from '../layouts';
import { authRoutes } from '@/modules/auth/routes';
import { errorLogsRoutes } from '@/modules/error-logs/routes';
import { userManagementRoutes } from '@/modules/user-management/routes';
import { snapshotRoutes } from '@/modules/snapshots/routes';
import { recordingRoutes } from '@/modules/recordings/routes';
import { talkSessionsRoutes } from '@/modules/talk-sessions/routes';
import { cameraFailuresRoutes } from '@/modules/camera-failures/routes';
import { psoStreamingRoutes } from '@/modules/pso-streaming/routes';
import { contactManagerDashboardRoutes } from '@/modules/contact-manager-dashboard/routes';
import { psoDashboardRoutes } from '@/modules/pso-dashboard/routes';

/**
 * Injects a fresh API token into the Axios client once the user is authenticated.
 * Returns null (renders nothing).
 */
function TokenInjector(): null {
  const { getApiToken, account, initialized } = useAuth();

  useEffect(() => {
    if (!initialized || !account) {
      logDebug('TokenInjector: user not ready, skipping token registration');
      return;
    }
    setTokenGetter(getApiToken);
    logDebug('TokenInjector: registered API token getter');
  }, [initialized, account, getApiToken]);

  return null;
}

/**
 * Layout wrapper that includes providers and token injection
 * 
 * @returns JSX element with providers and outlet for routes
 */
function AppProviders(): JSX.Element {
  return (
    <AuthProvider>
      <ToastProvider>
        <WebSocketProvider>
          <TokenInjector />
          <Outlet />
        </WebSocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

/**
 * Creates and configures the browser router with all application routes
 * 
 * @returns Configured browser router instance
 */
const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      // Public routes (no layout)
      ...authRoutes(),
      
      // Protected routes (with DashboardLayout)
      {
        element: <DashboardLayout />,
        children: [
          ...errorLogsRoutes(),
          ...userManagementRoutes(),
          ...snapshotRoutes(),
          ...recordingRoutes(),
          ...talkSessionsRoutes(),
          ...cameraFailuresRoutes(),
          ...psoStreamingRoutes(),
          ...contactManagerDashboardRoutes(),
          ...psoDashboardRoutes(),
        ],
      },
      
      // Fallback route
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);

/**
 * Root application router component
 * 
 * Renders the RouterProvider with the configured router instance.
 * 
 * @returns JSX element with the RouterProvider
 */
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
