import React, { useEffect } from 'react';
import {
  BrowserRouter,
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
 * Inyecta el token Bearer en cada petición axios
 */
function TokenInjector() {
  const { getApiToken, account, initialized } = useAuth();

  useEffect(() => {
    if (initialized && account) {
      setTokenGetter(getApiToken);
    }
  }, [initialized, account, getApiToken]);

  return null;
}

/**
 * Espera a que MSAL haya procesado cualquier hash #code=…
 * antes de renderizar las rutas, evitando el hash_empty_error.
 */
function Gate() {
  const { initialized } = useAuth();
  if (!initialized) {
    return <div />;  // aquí podrías mostrar un loader si quieres
  }
  return (
    <Routes>
      {/* rutas públicas */}
      <Route path="/login"     element={<LoginPage />} />

      {/* rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Employee', 'Supervisor', 'Admin']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* catch-all */}
      <Route path="/"    element={<Navigate to="/dashboard" replace />} />
      <Route path="*"    element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/**
 * Punto de entrada de la app.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TokenInjector />
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
