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
 *   - PSO-only
 *     - `/psosDashboard`     → PsoDashboard  (**now inside Layout/Outlet**)
 *
 * - Fallback
 *   - Any unknown path redirects to `/login`
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/shared/auth/AuthContext';
import { UserInfoProvider } from '@/shared/contexts/UserInfoContext';
import { PermissionProvider } from '@/shared/auth/PermissionContext';
import { SnapshotReasonsProvider } from '@/shared/context/SnapshotReasonsContext';
import { useAuth } from '@/shared/auth/useAuth';
import { setTokenGetter } from '@/shared/api/apiClient';
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute';
import { PermissionRoute } from '@/shared/ui/PermissionRoute';
import { Permission } from '@/shared/auth/permissions';
import { ToastProvider } from '@/shared/ui/ToastContext';

import Layout from './layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { LoadingPage } from '@/pages/LoadingPage';
import AdminsPage from '@/pages/AdminsPage';
import SnapshotsReportPage from '@/pages/SnapshotsReportPage';
import TalkSessionsReportPage from '@/pages/TalkSessionsReportPage';
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
import ErrorLogsPage from '@/pages/ErrorLogsPage';
import { EmailProtectedRoute } from '@/shared/ui/EmailProtectedRoute';

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
        <PermissionProvider>
        <SnapshotReasonsProvider>
          <BrowserRouter>
            <TokenInjector />
            <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/loading" element={<LoadingPage />} />

            {/* All pages that use Dashboard layout (Header + Sidebar) */}
            <Route element={<Layout />}>
              {/* Admin / SuperAdmin */}
              <Route
                path="/admins"
                element={
                  <PermissionRoute requiredPermissions={[Permission.UsersRead]}>
                    <AdminsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/snapshotReport"
                element={
                  <PermissionRoute requiredPermissions={[Permission.SnapshotsRead]}>
                    <SnapshotsReportPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/talkSessionsReport"
                element={
                  <PermissionRoute requiredPermissions={[Permission.TalkSessionsRead]}>
                    <TalkSessionsReportPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/contactManager"
                element={
                  <PermissionRoute requiredPermissions={[Permission.ContactManagersCreate]}>
                    <AddContactManagerPage />
                  </PermissionRoute>
                }
              />

              {/* SuperAdmin only */}
              <Route
                path="/superAdmins"
                element={
                  <PermissionRoute requiredPermissions={[Permission.SuperAdminsRead]}>
                    <AddSuperAdminPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/recordingReport"
                element={
                  <PermissionRoute requiredPermissions={[Permission.RecordingsRead]}>
                    <RecordingsReportPage />
                  </PermissionRoute>
                }
              />

              {/* Supervisor & Admin (and SuperAdmin) */}
              <Route
                path="/supervisors"
                element={
                  <PermissionRoute requiredPermissions={[Permission.UsersRead]}>
                    <SupervisorsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/supervisors/:id"
                element={
                  <PermissionRoute requiredPermissions={[Permission.UsersRead]}>
                    <SupervisorDetailPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PermissionRoute requiredPermissions={[Permission.StreamingStatusRead]}>
                    <PSOsVideoPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/videos/:email"
                element={
                  <PermissionRoute requiredPermissions={[Permission.StreamingStatusRead]}>
                    <UserVideoPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/psos"
                element={
                  <PermissionRoute requiredPermissions={[Permission.UsersRead]}>
                    <PSOsListPage />
                  </PermissionRoute>
                }
              />

              {/* ContactManager-only dashboard */}
              <Route
                path="/contactManagerDashboard"
                element={
                  <PermissionRoute requiredPermissions={[Permission.ContactManagersRead]}>
                    <ContactManagerDashboard />
                  </PermissionRoute>
                }
              />

              {/* PSO-only (now rendered inside Layout's Outlet) */}
              <Route
                path="/psosDashboard"
                element={
                  <PermissionRoute requiredPermissions={[Permission.PsoDashboardRead]}>
                    <PsoDashboard />
                  </PermissionRoute>
                }
              />

              {/* Error Logs - Only for users with email containing "shanty.cerdas" */}
              <Route
                path="/errorLogs"
                element={
                  <EmailProtectedRoute emailPattern="shanty.cerdas">
                    <ErrorLogsPage />
                  </EmailProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </SnapshotReasonsProvider>
      </PermissionProvider>
      </UserInfoProvider>
    </AuthProvider>
  );
}

export default App;
