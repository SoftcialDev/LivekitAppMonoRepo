import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
 * 2. Otherwise, inspect the user's roles:
 *    - If they include "Employee" → redirect to "/psosDashboard".
 *    - Else if they include "Admin" or "Supervisor" → redirect to "/dashboard".
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
  const { isLoggedIn, account } = useAuth();

  // 1) redirect unauthenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // pull roles from token
  const claims = (account?.idTokenClaims ?? {}) as Record<string, any>;
  const rolesClaim =
    claims.roles ??
    claims.role ??
    claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const roles: string[] = Array.isArray(rolesClaim)
    ? rolesClaim
    : typeof rolesClaim === 'string'
    ? [rolesClaim]
    : [];

  // 2) if allowedRoles provided, enforce them
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = roles.some(r => allowedRoles.includes(r));
    if (!hasAccess) {
      // Not permitted to see this route—send to their default landing
      if (roles.includes('Employee')) {
        return <Navigate to="/psosDashboard" replace />;
      }
      if (roles.includes('Admin') || roles.includes('Supervisor')) {
        return <Navigate to="/dashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // 3) If no allowedRoles, or if they passed the allowedRoles check, render children
  return children;
};
