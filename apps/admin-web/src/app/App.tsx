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
 *   - `/contactManagerDashboard` → ContactManagerDashboard (ContactManager only)
 *   - Fallback: redirect any unknown path to `/login`
 */

import AdminsPage from '@/pages/AdminsPage';
import { LoginPage } from '@/pages/LoginPage';
import { setTokenGetter } from '@/shared/api/apiClient';
import { AuthProvider } from '@/shared/auth/AuthContext';
import { useAuth } from '@/shared/auth/useAuth';
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute';
import { ToastProvider } from '@/shared/ui/ToastContext';
import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Layout from './layouts/DashboardLayout';
import SnapshotsReportPage from '@/pages/SnapshotsReportPage';
import AddContactManagerPage from '@/pages/AddContactManagerPage';
import SupervisorsPage from '@/pages/SupervisorsPage';
import PSOsVideoPage from '@/pages/PSOsVideoPage';
import SupervisorDetailPage from '@/pages/AddPsoToSupervisorPage';
import UserVideoPage from '@/pages/UserVideoPage';
import PSOsListPage from '@/pages/PsoListPage';
import ContactManagerDashboard from '@/pages/ContactManager';
import PsoDashboard from '@/pages/PsoDashboardPage';
import RecordingsReportPage from '@/pages/RecordingsReportPage';



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
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin, Supervisor & ContactManager all share the Layout */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'ContactManager']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Admin only */}
              <Route
                path="/admins"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/snapshotReport"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <SnapshotsReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recordingReport"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <RecordingsReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contactManager"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AddContactManagerPage />
                  </ProtectedRoute>
                }
              />

              {/* Supervisor & Admin */}
              <Route
                path="/supervisors"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
                    <SupervisorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisors/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
                    <SupervisorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
                    <PSOsVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/videos/:email"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
                    <UserVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/psos"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
                    <PSOsListPage />
                  </ProtectedRoute>
                }
              />

              {/* ContactManager-only dashboard */}
              <Route
                path="/contactManagerDashboard"
                element={
                  <ProtectedRoute allowedRoles={['ContactManager']}>
                    <ContactManagerDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Employee-only */}
            <Route
              path="/psosDashboard"
              element={
                <ProtectedRoute allowedRoles={['Employee']}>
                  <PsoDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
