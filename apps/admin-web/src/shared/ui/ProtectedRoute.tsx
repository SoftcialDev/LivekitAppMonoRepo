import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useUserInfo } from '../hooks/useUserInfo';


/**
 * Props for ProtectedRoute.
 */
interface ProtectedRouteProps {
  /**
   * The element(s) to render if access is allowed.
   */
  children: JSX.Element;

  /**
   * Optional array of roles allowed to access.
   * If omitted, any authenticated user may proceed to their default landing.
   */
  allowedRoles?: string[];
}

/**
 * Wraps its children in an authentication + role check.
 *
 * 1. If not authenticated → redirect to "/login".  
 * 2. If no user info loaded → redirect to "/loading".
 * 3. Otherwise, inspect the user's role from database:
 *    - If role is "Employee" → redirect to "/psosDashboard".
 *    - Else if role is "Admin", "Supervisor", or "SuperAdmin" → redirect to "/dashboard".
 *    - Else if role is "ContactManager" → redirect to "/contactManagerDashboard".
 *    - Else → redirect to "/login".
 *
 * If `allowedRoles` is provided, users whose roles match may see `children`;
 * others are sent to their default landing (per above).
 *
 * @param children     Protected element(s).
 * @param allowedRoles Roles permitted to access.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { account, initialized } = useAuth();
  const { userInfo, isLoading } = useUserInfo();

  // 1) redirect unauthenticated
  if (!initialized || !account) {
    return <Navigate to="/login" replace />;
  }

  // 2) redirect to loading if user info not loaded yet
  if (!userInfo && !isLoading) {
    return <Navigate to="/loading" replace />;
  }

  // 3) if still loading, show loading
  if (isLoading || !userInfo) {
    return <div>Loading...</div>;
  }

  // 4) if allowedRoles provided, enforce them
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.includes(userInfo.role || '');
    if (!hasAccess) {
      // Not permitted to see this route—send to their default landing
      if (userInfo.role === 'Employee') {
        return <Navigate to="/psosDashboard" replace />;
      }
      if (userInfo.role === 'Admin' || userInfo.role === 'Supervisor' || userInfo.role === 'SuperAdmin') {
        return <Navigate to="/dashboard" replace />;
      }
      if (userInfo.role === 'ContactManager') {
        return <Navigate to="/contactManagerDashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // 5) If no allowedRoles, or if they passed the allowedRoles check, render children
  return children;
};
