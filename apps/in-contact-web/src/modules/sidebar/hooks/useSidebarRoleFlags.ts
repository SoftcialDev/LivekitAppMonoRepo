/**
 * @fileoverview useSidebarRoleFlags hook
 * @summary Hook for computing role-based flags
 * @description Provides boolean flags based on the current user's role for conditional rendering
 */

import { useMemo } from 'react';
import { UserRole } from '@/modules/auth/enums';
import type { IUseSidebarRoleFlagsReturn } from '../types';

/**
 * Hook for computing role-based flags
 *
 * Computes boolean flags based on the current user's role.
 * These flags are used throughout the sidebar for conditional rendering.
 *
 * @param currentRole - Current user's role (from useUserInfo)
 * @returns Object with boolean flags for each role
 *
 * @example
 * ```typescript
 * const { isAdmin, isSupervisor } = useSidebarRoleFlags(userInfo?.role ?? null);
 * ```
 */
export function useSidebarRoleFlags(
  currentRole: UserRole | null | undefined
): IUseSidebarRoleFlagsReturn {
  return useMemo(
    () => ({
      isAdmin: currentRole === UserRole.Admin,
      isSupervisor: currentRole === UserRole.Supervisor,
      isSuperAdmin: currentRole === UserRole.SuperAdmin,
      isPso: currentRole === UserRole.PSO,
    }),
    [currentRole]
  );
}

