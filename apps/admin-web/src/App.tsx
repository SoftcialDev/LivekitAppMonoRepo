/**
 * @file Entry point of the React application.
 * Sets up authentication, layout, and all routes with role-based access control.
 */

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
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


/**
 * Main application component.
 *
 * Wraps all routes in AuthProvider and configures:
 *  - Public routes: /login, /forbidden
 *  - Protected routes under Layout, accessible only to admin & supervisor
 *  - /admins further restricted to admin only
 *  - /supervisors, /psos, /dashboard, /videos/:username accessible to admin & supervisor
 *  - All others redirect to /dashboard
 *
 * @returns {JSX.Element} The router configuration.
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: login page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public: forbidden page for unauthorized access */}
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/*
            Protected area:
            - Only 'admin' and 'supervisor' roles may enter any of these routes.
            - Employees and unauthenticated users will be redirected to /login or /forbidden.
          */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['Admin','Supervisor']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/*
              Admins page:
              - Only 'admin' role may view /admins.
              - 'supervisor' will hit /forbidden.
            */}
            <Route
              path="/admins"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminsPage />
                </ProtectedRoute>
              }
            />

            {/* Supervisors page, accessible to both 'admin' and 'supervisor' */}
            <Route
              path="/supervisors"
              element={<SupervisorsPage/>}
            />

            {/* PSO list page under Manage, same as supervisors+admins */}
            <Route path="/psos" element={<PSOsListPage />} />

            {/* Dashboard alias for PSOsPage */}
            <Route path="/dashboard" element={<PSOsPage />} />

            {/* Individual user video, admin & supervisor only */}
            <Route
              path="/videos/:username"
              element={<UserVideoPage />}
            />
          </Route>

          {/* Catch-all redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
