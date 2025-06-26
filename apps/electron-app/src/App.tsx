/**
 * @file Entry point of the React application.
 * Sets up authentication, layout, and all routes with role-based access control.
 * Also integrates the token injector for secure API communication via apiClient.
 */

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import ForbiddenPage from './features/auth/pages/ForbiddenPage';
import Layout from './components/DashboardLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import AdminsPage from './features/userManagement/AdminsPage';
import SupervisorsPage from './features/userManagement/SupervisorsPage';
import PSOsPage from './features/videoDashboard/pages/PSOsVideoPage';
import PSOsListPage from './features/userManagement/PsoListPage';
import UserVideoPage from './features/videoDashboard/pages/UserVideoPage';
import { setTokenGetter } from './services/apiClient';
import { useAuth } from './features/auth/hooks/useAuth';

/**
 * Component to register the token injector after authentication is initialized.
 * Should wrap all routes and run once user context is ready.
 */
function TokenInjector(): null {
  const { getApiToken, account, initialized } = useAuth();

  useEffect(() => {
    if (!initialized || !account) {
      console.log('User not ready; token injection skipped.');
      return;
    }
    // Register getApiToken itself, so it’s called per request
    setTokenGetter(getApiToken);
  }, [initialized, account, getApiToken]);

  return null; 
}

/**
 * Main application component.
 *
 * Wraps all routes in AuthProvider and configures:
 *  - Public routes: /login, /forbidden
 *  - Protected routes under Layout, accessible only to Admin & Supervisor
 *  - /admins restricted to Admin only
 *  - Catch-all redirects to /dashboard
 *
 * Also injects the token function into the Axios client once the session is ready.
 *
 * @returns {JSX.Element} The router configuration.
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TokenInjector />
        <Routes>
          {/* Public: login page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public: forbidden page for unauthorized access */}
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Protected routes for Admin & Supervisor */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Admin-only route */}
            <Route
              path="/admins"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminsPage />
                </ProtectedRoute>
              }
            />

            {/* Shared routes */}
            <Route path="/supervisors" element={<SupervisorsPage />} />
            <Route path="/psos" element={<PSOsListPage />} />
            <Route path="/dashboard" element={<PSOsPage />} />
            <Route path="/videos/:username" element={<UserVideoPage />} />
          </Route>

          {/* Catch-all redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
