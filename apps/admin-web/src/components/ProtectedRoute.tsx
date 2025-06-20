import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * ProtectedRoute component.
 *
 * Wraps its children and only renders them if the user is authenticated.
 * If not authenticated, redirects to '/login'.
 *
 * @param {object} props
 * @param {JSX.Element} props.children - The protected component(s) to render when authenticated.
 *
 * @returns {JSX.Element | null} The children if authenticated, otherwise a <Navigate> redirect to '/login'.
 *
 * @example
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <DashboardPage />
 *     </ProtectedRoute>
 *   }
 * />
 */
export const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  // useAuth provides authentication state: isLoggedIn is true when a session exists.
  const { isLoggedIn } = useAuth();

  // If authenticated, render the protected children.
  // Otherwise, redirect to '/login'. The `replace` prop prevents adding a new history entry.
  if (isLoggedIn) {
    return children;
  } else {
    return <Navigate to="/login" replace />;
  }
};
