/**
 * @fileoverview EmailProtectedRoute - Route protection based on email
 * @summary Protects routes based on user email matching a pattern
 * @description Wraps its children in an email-based access check.
 * 
 * 1. If not authenticated → redirect to "/login"
 * 2. If no user info loaded → redirect to "/loading"
 * 3. If user's email contains the emailPattern → render children
 * 4. Otherwise → redirect to default landing based on role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { useUserInfo } from '@/modules/auth';
import type { IEmailProtectedRouteProps } from './types';
import { UserRole } from '@/modules/auth';

/**
 * EmailProtectedRoute component
 * 
 * Wraps its children in an email-based access check.
 * 
 * Flow:
 * 1. If not authenticated → redirect to "/login"
 * 2. If no user info loaded → redirect to "/loading"
 * 3. If user's email contains the emailPattern → render children
 * 4. Otherwise → redirect to default landing based on role
 * 
 * @param props.children - Protected element(s)
 * @param props.emailPattern - String that must be contained in user's email
 * @returns Protected children or redirect component
 * 
 * @example
 * ```tsx
 * <EmailProtectedRoute emailPattern="shanty.cerdas">
 *   <ErrorLogsPage />
 * </EmailProtectedRoute>
 * ```
 */
export const EmailProtectedRoute: React.FC<IEmailProtectedRouteProps> = ({
  children,
  emailPattern,
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

  // 4) check if email contains the pattern
  const userEmail = account?.username?.toLowerCase() || '';
  const pattern = emailPattern.toLowerCase();
  const hasAccess = userEmail.includes(pattern);

  if (!hasAccess) {
    // Not permitted - send to their default landing
    if (userInfo.role === UserRole.PSO) {
      return <Navigate to="/psosDashboard" replace />;
    }
    if (
      userInfo.role === UserRole.Admin ||
      userInfo.role === UserRole.Supervisor ||
      userInfo.role === UserRole.SuperAdmin
    ) {
      return <Navigate to="/psos-streaming" replace />;
    }
    if (userInfo.role === UserRole.ContactManager) {
      return <Navigate to="/contactManagerDashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // 5) If email matches, render children
  return <>{children}</>;
};

