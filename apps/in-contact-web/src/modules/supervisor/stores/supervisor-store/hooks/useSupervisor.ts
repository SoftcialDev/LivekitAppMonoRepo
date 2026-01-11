/**
 * @fileoverview useSupervisor hook
 * @summary Hook for accessing supervisor store
 * @description Provides convenient access to supervisor store state
 */

import { useSupervisorStore } from '../useSupervisorStore';

import type { ISupervisorChangeData } from '../../../types/supervisorTypes';

/**
 * Hook for accessing supervisor change notifications
 * 
 * Components can use this to react to supervisor changes.
 * The hook will re-render when supervisor changes occur.
 * 
 * @returns Last supervisor change data or null
 * 
 * @example
 * ```typescript
 * const lastChange = useSupervisorChange();
 * useEffect(() => {
 *   if (lastChange) {
 *     refetch();
 *   }
 * }, [lastChange]);
 * ```
 */
export function useSupervisorChange(): ISupervisorChangeData | null {
  return useSupervisorStore((state) => state.lastSupervisorChange);
}

/**
 * Hook for accessing supervisor list change notifications
 * 
 * @returns Last supervisor list change data or null
 */
export function useSupervisorListChange(): unknown | null {
  return useSupervisorStore((state) => state.lastSupervisorListChange);
}

