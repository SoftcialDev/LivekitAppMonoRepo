/**
 * @file App.tsx
 * @description
 * Application entry point and router.
 *
 * Responsibilities:
 * - Bootstraps authentication (`AuthProvider`) and toast notifications (`ToastProvider`).
 * - Registers a token getter with the API client after auth is ready.
 * - Declares all routes with **role-based access control** and groups
 *   the UI under a shared **Dashboard `Layout`** (Header + Sidebar) via nested routes.
 *
 * Routes:
 * - Public
 *   - `/login` → LoginPage
 *
 * - Nested under `<Layout />` (rendered inside its `<Outlet />`)
 *   - Admin-only
 *     - `/admins`            → AdminsPage
 *     - `/snapshotReport`    → SnapshotsReportPage
 *     - `/contactManager`    → AddContactManagerPage
 *   - SuperAdmin-only
 *     - `/superAdmins`       → AddSuperAdminPage
 *     - `/recordingReport`   → RecordingsReportPage
 *   - Admin & Supervisor (and SuperAdmin)
 *     - `/supervisors`       → SupervisorsPage
 *     - `/supervisors/:id`   → SupervisorDetailPage
 *     - `/dashboard`         → PSOsVideoPage
 *     - `/videos/:email`     → UserVideoPage
 *     - `/psos`              → PSOsListPage
 *   - ContactManager-only
 *     - `/contactManagerDashboard` → ContactManagerDashboard
 *   - Employee-only
 *     - `/psosDashboard`     → PsoDashboard  (**now inside Layout/Outlet**)
 *
 * - Fallback
 *   - Any unknown path redirects to `/login`
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/shared/auth/AuthContext';
import { UserInfoProvider } from '@/shared/contexts/UserInfoContext';
import { useAuth } from '@/shared/auth/useAuth';
import { setTokenGetter } from '@/shared/api/apiClient';
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute';
import { ToastProvider } from '@/shared/ui/ToastContext';

import Layout from './layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { LoadingPage } from '@/pages/LoadingPage';
import AdminsPage from '@/pages/AdminsPage';
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
import AddSuperAdminPage from '@/pages/AddSuperAdminManagerPage';

/**
 * Injects a fresh API token into the Axios client once the user is authenticated.
 * Returns `null` (renders nothing).
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
 * Root application component: providers + router.
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <UserInfoProvider>
        <BrowserRouter>
          <TokenInjector />
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/loading" element={<LoadingPage />} />

            {/* All pages that use Dashboard layout (Header + Sidebar) */}
            <Route element={<Layout />}>
              {/* Admin only */}
              <Route
                path="/admins"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <AdminsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/snapshotReport"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <SnapshotsReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contactManager"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <AddContactManagerPage />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin only */}
              <Route
                path="/superAdmins"
                element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <AddSuperAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recordingReport"
                element={
                  <ProtectedRoute allowedRoles={['SuperAdmin']}>
                    <RecordingsReportPage />
                  </ProtectedRoute>
                }
              />

              {/* Supervisor & Admin (and SuperAdmin) */}
              <Route
                path="/supervisors"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'SuperAdmin']}>
                    <SupervisorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisors/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'SuperAdmin']}>
                    <SupervisorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'SuperAdmin']}>
                    <PSOsVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/videos/:email"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'SuperAdmin']}>
                    <UserVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/psos"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'SuperAdmin']}>
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

              {/* Employee-only (now rendered inside Layout's Outlet) */}
              <Route
                path="/psosDashboard"
                element={
                  <ProtectedRoute allowedRoles={['Employee']}>
                    <PsoDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </ToastProvider>
        </BrowserRouter>
      </UserInfoProvider>
    </AuthProvider>
  );
}

export default App;
