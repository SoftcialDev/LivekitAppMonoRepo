/**
 * @fileoverview Routes for auth module
 * @summary Authentication routes configuration
 * @description Defines all routes related to authentication.
 * Returns an array of route configuration objects for use with createBrowserRouter.
 * 
 * Routes:
 * - `/login` - Login page with MSAL authentication
 * - `/loading` - Loading page that fetches user info after authentication
 */

import type { RouteObject } from 'react-router-dom';
import { LoginPage, LoadingPage } from './pages';

/**
 * Returns route configuration objects for the authentication module
 * 
 * These are public routes that handle login and loading states.
 * They should be composed directly in AppRouter, outside of any layout
 * component (they don't use DashboardLayout).
 * 
 * @returns Array of route configuration objects
 */
export function authRoutes(): RouteObject[] {
  return [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/loading',
      element: <LoadingPage />,
    },
  ];
}
