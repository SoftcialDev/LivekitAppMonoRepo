/**
 * @fileoverview EmailProtectedRoute - Route protection based on email
 * @description Protects routes based on user email matching a pattern
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useUserInfo } from '../hooks/useUserInfo';

/**
 * Props for EmailProtectedRoute
 */
interface EmailProtectedRouteProps {
  /**
   * The element(s) to render if access is allowed
   */
  children: JSX.Element;

  /**
   * Email pattern that must be contained in the user's email
   */
  emailPattern: string;
}

/**
 * Wraps its children in an email-based access check.
 *
 * 1. If not authenticated → redirect to "/login"
 * 2. If no user info loaded → redirect to "/loading"
 * 3. If user's email contains the emailPattern → render children
 * 4. Otherwise → redirect to default landing based on role
 *
 * @param children - Protected element(s)
 * @param emailPattern - String that must be contained in user's email
 */
export const EmailProtectedRoute: React.FC<EmailProtectedRouteProps> = ({
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

  // 5) If email matches, render children
  return children;
};

