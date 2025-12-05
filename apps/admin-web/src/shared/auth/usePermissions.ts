/**
 * @fileoverview usePermissions
 * @description Hook to consume PermissionContext.
 */

import { useContext } from 'react';
import PermissionContext from './PermissionContext';

/**
 * Hook to access permission helpers and codes.
 */
export function usePermissions() {
  return useContext(PermissionContext);
}

