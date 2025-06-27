import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Props for ProtectedRoute.
 */
interface ProtectedRouteProps {
  /** The element(s) to render if access is allowed. */
  children: JSX.Element;
  /**
   * Optional array of roles allowed to access.
   * If omitted, any authenticated user may proceed.
   */
  allowedRoles?: string[];
}

/**
 * Wraps its children in an authentication + role check.
 *
 * 1. If not authenticated → redirect to "/login".  
 * 2. If authenticated but no matching role → redirect to "/forbidden".  
 * 3. Otherwise → render children.
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

  // 2) if roles are restricted, check idTokenClaims.roles
  if (allowedRoles && allowedRoles.length > 0) {
    const claims = (account?.idTokenClaims ?? {}) as Record<string, any>;
    const rolesClaim = claims.roles ?? claims.role;
    const roles: string[] = Array.isArray(rolesClaim)
      ? rolesClaim
      : typeof rolesClaim === 'string'
      ? [rolesClaim]
      : [];

    const hasAccess = roles.some(r => allowedRoles.includes(r));
    if (!hasAccess) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  // 3) allowed
  return children;
};
