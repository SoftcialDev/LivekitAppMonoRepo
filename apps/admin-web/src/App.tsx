import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { VideoDashboard } from './features/videoDashboard/VideoGrid';

/**
 * App component.
 *
 * Wraps the application in authentication context and defines client-side routes.
 *
 * - Wraps children with AuthProvider so that authentication state and actions
 *   (login, logout, token acquisition) are available via context.
 * - Uses BrowserRouter to enable navigation via HTML5 history API.
 * - Defines a public route for '/login'.
 * - Defines a protected route for '/dashboard' that requires an authenticated session.
 * - Redirects '/' and any unmatched path to '/dashboard', where ProtectedRoute
 *   verifies authentication and either shows VideoDashboard or redirects to '/login'.
 *
 * @returns {JSX.Element} The application with routing and authentication context.
 */
function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route: renders LoginPage when URL is '/login' */}
          <Route path="/login" element={<LoginPage />} />

          {/*
            Protected route: renders VideoDashboard only if the user is authenticated.
            ProtectedRoute checks authentication state from context and either renders
            the child component or redirects to '/login'.
          */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <VideoDashboard />
              </ProtectedRoute>
            }
          />

          {/*
            Redirect root path '/' to '/dashboard'.
            When navigating to '/', user is sent to '/dashboard'.
            ProtectedRoute then enforces authentication.
          */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/*
            Catch-all route: any unmatched URL redirects to '/dashboard'.
            This ensures deep links or typos resolve to the dashboard route,
            where authentication is checked.
          */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
