/**
 * @fileoverview PermissionContext
 * @description React context exposing effective permissions and helpers.
 */

import React, { createContext, useMemo, ReactNode } from 'react';
import { Permission } from './permissions';
import { useUserInfo } from '../hooks/useUserInfo';

/**
 * Shape of the permission context value.
 */
export interface PermissionContextValue {
  /**
   * Raw permission codes from backend.
   */
  permissions: string[];

  /**
   * Checks if the user has the given permission.
   */
  hasPermission: (permission: Permission | string) => boolean;

  /**
   * Checks if the user has at least one of the provided permissions.
   */
  hasAnyPermission: (perms: Array<Permission | string>) => boolean;

  /**
   * Checks if the user has all provided permissions.
   */
  hasAllPermissions: (perms: Array<Permission | string>) => boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

/**
 * Provides permission helpers derived from the current user's data.
 */
export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userInfo } = useUserInfo();

  const permissions = userInfo?.permissions ?? [];
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const hasPermission = (permission: Permission | string): boolean =>
    permissionSet.has(permission as string);

  const hasAnyPermission = (perms: Array<Permission | string>): boolean =>
    perms.some((p) => permissionSet.has(p as string));

  const hasAllPermissions = (perms: Array<Permission | string>): boolean =>
    perms.every((p) => permissionSet.has(p as string));

  const value: PermissionContextValue = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export default PermissionContext;

