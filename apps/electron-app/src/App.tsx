/**
 * @file Entry point of the React application.
 * Sets up authentication, token injection, and routes with role-based access control.
 */

import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { setTokenGetter } from './services/apiClient';
import { useAuth } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import ForbiddenPage from './features/auth/pages/ForbiddenPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';

/**
 * @component
 * @name TokenInjector
 * @description
 * Registers the API token getter with the axios client once MSAL auth is initialized.
 * Ensures every request uses a fresh access token.
 * Renders nothing.
 */
function TokenInjector(): null {
  const { initialized, account, getApiToken } = useAuth();

  useEffect(() => {
    if (initialized && account) {
      setTokenGetter(getApiToken);
    }
  }, [initialized, account, getApiToken]);

  return null;
}

/**
 * @component
 * @name App
 * @description
 * Wraps application routes in authentication context and router.
 * - Public routes: /login, /forbidden
 * - Protected route: /dashboard (Employee only)
 * - All other paths redirect to /dashboard
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TokenInjector />

        <Routes>
          {/* Public pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Dashboard: only Employees may access */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Employee']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect everything else to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
