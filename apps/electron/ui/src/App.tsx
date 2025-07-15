import React, { useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider }   from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage }      from './pages/LoginPage';
import DashboardPage      from './pages/Dashboard';

import { setTokenGetter } from './services/apiClient';
import { useAuth }        from './hooks/useAuth';

/**
 * Injects the Bearer token into every Axios request.
 *
 * @remarks
 * Uses the `getApiToken` from AuthContext once initialization is complete.
 */
function TokenInjector(): null {
  const { getApiToken, account, initialized } = useAuth();

  useEffect(() => {
    if (initialized && account) {
      setTokenGetter(getApiToken);
    }
  }, [initialized, account, getApiToken]);

  return null;
}

/**
 * Waits for MSAL to process any redirect hash (#code=…) before rendering routes.
 *
 * @remarks
 * Prevents the `hash_empty_error` by holding off on route rendering until AuthContext is ready.
 */
function Gate(): JSX.Element {
  const { initialized } = useAuth();
  if (!initialized) {
    return <div />;  // You can replace this with a spinner or splash screen if desired
  }
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Employee', 'Supervisor', 'Admin']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect all other paths to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/**
 * Application entry point.
 *
 * @remarks
 * Wraps the entire app in authentication context and uses HashRouter
 * to ensure client-side routing works under file:// protocol.
 */
export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <Router>
        <TokenInjector />
        <Gate />
      </Router>
    </AuthProvider>
  );
}
