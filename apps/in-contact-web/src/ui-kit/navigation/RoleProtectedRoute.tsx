/**
 * @fileoverview RoleProtectedRoute - Route protection based on user role
 * @summary Protects routes based on user role
 * @description Wraps its children in a role-based access check.
 * 
 * 1. If not authenticated → redirect to "/login"
 * 2. If no user info loaded → redirect to "/loading"
 * 3. If user's role matches allowedRoles → render children
 * 4. Otherwise → redirect to default landing based on role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { useUserInfo } from '@/modules/auth';
import { UserRole } from '@/modules/auth/enums';
import type { IRoleProtectedRouteProps } from './types';

/**
 * RoleProtectedRoute component
 * 
 * Wraps its children in a role-based access check.
 * 
 * Flow:
 * 1. If not authenticated → redirect to "/login"
 * 2. If no user info loaded → redirect to "/loading"
 * 3. If user's role is in allowedRoles → render children
 * 4. Otherwise → redirect to default landing based on role
 * 
 * @param props.children - Protected element(s)
 * @param props.allowedRoles - Array of roles that have access
 * @returns Protected children or redirect component
 * 
 * @example
 * ```tsx
 * <RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
 *   <AdminPage />
 * </RoleProtectedRoute>
 * ```
 */
export const RoleProtectedRoute: React.FC<IRoleProtectedRouteProps> = ({
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

  // 4) check if user's role is in allowedRoles
  const userRole = userInfo.role;
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    // Not permitted - send to their default landing
    if (userRole === UserRole.PSO) {
      return <Navigate to="/psosDashboard" replace />;
    }
    if (
      userRole === UserRole.Admin ||
      userRole === UserRole.Supervisor ||
      userRole === UserRole.SuperAdmin
    ) {
      return <Navigate to="/psos-streaming" replace />;
    }
    if (userRole === UserRole.ContactManager) {
      return <Navigate to="/contactManagerDashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // 5) If role matches, render children
  return <>{children}</>;
};

