/**
 * @fileoverview useAdminRestrictions - Hook for managing ADMIN/SuperAdmin role restrictions
 * @summary Provides logic to restrict PSO monitoring for ADMIN and SuperAdmin users
 * @description This hook determines if the current user is an ADMIN or SuperAdmin and provides
 * UI restrictions to limit the number of concurrent PSO streams to reduce costs.
 * Supervisors continue to work normally without restrictions.
 */

import { useMemo } from 'react';
import { useUserInfo } from '@/shared/hooks/useUserInfo';

/**
 * Interface for admin restriction configuration
 */
export interface AdminRestrictions {
  /**
   * True if current user is an ADMIN or SuperAdmin role
   */
  isAdmin: boolean;
  
  /**
   * True if current user is a Supervisor (no restrictions)
   */
  isSupervisor: boolean;
  
  /**
   * True if restrictions should be applied (only for ADMIN users)
   */
  shouldApplyRestrictions: boolean;
  
  /**
   * Custom message to show when no PSOs are selected for monitoring
   */
  getNoPsosMessage: () => string;
  
  /**
   * True if layout dropdown should be hidden
   */
  hideLayoutDropdown: boolean;
}

/**
 * Hook for managing ADMIN/SuperAdmin role restrictions in PSO monitoring
 * 
 * @remarks
 * ADMIN and SuperAdmin users have restrictions to limit concurrent PSO streams and reduce costs.
 * Supervisors continue to work normally without any restrictions.
 * 
 * @returns Object containing admin restriction logic and UI configuration
 * 
 * @example
 * ```tsx
 * const { isAdmin, shouldApplyRestrictions, getNoPsosMessage } = useAdminRestrictions();
 * 
 * if (shouldApplyRestrictions && displayList.length === 0) {
 *   return <div>{getNoPsosMessage()}</div>;
 * }
 * ```
 */
export function useAdminRestrictions(): AdminRestrictions {
  const { userInfo } = useUserInfo();
  
  const restrictions = useMemo((): AdminRestrictions => {
    const userRole = userInfo?.role;
    const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
    const isSupervisor = userRole === 'Supervisor';
    const shouldApplyRestrictions = isAdmin;
    
    const getNoPsosMessage = (): string => {
      if (isAdmin) {
        return `To monitor a specific PSO, use the search selector above and check the box of the PSO you want to observe. Don't forget to unselect a PSO if you are not longer in need of supervising them.`;
      }
      return 'No PSOs to display';
    };
    
    return {
      isAdmin,
      isSupervisor,
      shouldApplyRestrictions,
      getNoPsosMessage,
      hideLayoutDropdown: isAdmin
    };
  }, [userInfo?.role]);
  
  return restrictions;
}
