/**
 * @fileoverview PermissionRoute
 * @description Route guard based on permissions (RBAC). Uses PermissionContext.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useUserInfo } from '../hooks/useUserInfo';
import { usePermissions } from '../auth/usePermissions';
import { Permission } from '../auth/permissions';

interface PermissionRouteProps {
  children: JSX.Element;
  /**
   * Permissions required to access the route. All must be present.
   */
  requiredPermissions: Array<Permission | string>;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  requiredPermissions,
}) => {
  const { account, initialized } = useAuth();
  const { userInfo, isLoading } = useUserInfo();
  const { hasAllPermissions } = usePermissions();

  if (!initialized || !account) {
    return <Navigate to="/login" replace />;
  }

  if (!userInfo && !isLoading) {
    return <Navigate to="/loading" replace />;
  }

  if (isLoading || !userInfo) {
    return <div>Loading...</div>;
  }

  const allowed = hasAllPermissions(requiredPermissions);
  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

