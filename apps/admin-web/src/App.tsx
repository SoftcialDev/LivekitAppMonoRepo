/**
 * @file App.tsx
 * @description
 * Entry point of the React application.  
 * - Sets up authentication context.  
 * - Injects API access token into the Axios client once the user is authenticated.  
 * - Defines all application routes with role-based access control:
 *   - `/login`        → LoginPage (public)
 *   - `/admins`       → AdminsPage (Admin only)
 *   - `/supervisors`  → SupervisorsPage (Admin & Supervisor)
 *   - `/supervisors/:id` → SupervisorDetailPage (Admin & Supervisor)
 *   - `/dashboard`    → PSOsVideoPage (Admin & Supervisor)
 *   - `/videos/:username` → UserVideoPage (Admin & Supervisor)
 *   - `/psosDashboard` → PsoDashboard (Employee only)
 *   - Fallback: redirect any unknown path to `/login`
 */

import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { setTokenGetter } from './services/apiClient';

import { LoginPage } from './features/auth/pages/LoginPage';
import Layout from './components/DashboardLayout';
import AdminsPage from './features/userManagement/AdminsPage';
import SupervisorsPage from './features/userManagement/SupervisorsPage';
import SupervisorDetailPage from './features/userManagement/AddPsoToSupervisorPage';
import PSOsVideoPage from './features/videoDashboard/pages/PSOsVideoPage';
import UserVideoPage from './features/videoDashboard/pages/UserVideoPage';
import PSOsListPage from './features/userManagement/PsoListPage';
import PsoDashboard from './hooks/PsoDashboard';
import { ToastProvider } from './components/ToastContext';

/**
 * TokenInjector
 *
 * Once `useAuth()` reports that the user is initialized and we have an `account`,
 * registers the `getApiToken` callback with our Axios `apiClient` so that
 * every request automatically includes a fresh bearer token.
 *
 * @returns `null` (renders nothing)
 */
function TokenInjector(): null {
  const { getApiToken, account, initialized } = useAuth();

  useEffect(() => {
    if (!initialized || !account) {
      console.debug('TokenInjector: user not ready, skipping token registration');
      return;
    }
    setTokenGetter(getApiToken);
    console.debug('TokenInjector: registered API token getter');
  }, [initialized, account, getApiToken]);

  return null;
}

/**
 * App
 *
 * Wraps the entire router tree within `AuthProvider` and defines all routes.
 *
 * @returns The application router configuration as JSX.
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TokenInjector />
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin & Supervisor-only routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={[ 'Admin', 'Supervisor' ]}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Admin only */}
              <Route
                path="/admins"
                element={
                  <ProtectedRoute allowedRoles={[ 'Admin' ]}>
                    <AdminsPage />
                  </ProtectedRoute>
                }
              />

              {/* Supervisor & Admin */}
              <Route
                path="/supervisors"
                element={
                  <ProtectedRoute allowedRoles={[ 'Admin', 'Supervisor' ]}>
                    <SupervisorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisors/:id"
                element={
                  <ProtectedRoute allowedRoles={[ 'Admin', 'Supervisor' ]}>
                    <SupervisorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ 'Admin', 'Supervisor' ]}>
                    <PSOsVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/videos/:email"
                element={
                  <ProtectedRoute allowedRoles={[ 'Admin', 'Supervisor' ]}>
                    <UserVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/psos"
                element={
                  <ProtectedRoute allowedRoles={[ 'Admin', 'Supervisor' ]}>
                    <PSOsListPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Employee-only route */}
            <Route
              path="/psosDashboard"
              element={
                <ProtectedRoute allowedRoles={[ 'Employee' ]}>
                  <PsoDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback: redirect any unknown path to /login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
