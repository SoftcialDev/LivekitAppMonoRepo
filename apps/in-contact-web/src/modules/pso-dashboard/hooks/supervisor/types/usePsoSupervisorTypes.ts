/**
 * @fileoverview Types for usePsoSupervisor hook
 * @summary Type definitions for PSO supervisor hook
 */

import type { ISupervisor } from '../../../types';

/**
 * Return type for usePsoSupervisor hook
 */
export interface IUsePsoSupervisorReturn {
  /**
   * Supervisor information or null if not assigned
   */
  supervisor: ISupervisor | null;

  /**
   * Whether supervisor data is currently loading
   */
  loading: boolean;

  /**
   * Error message if fetch failed, null otherwise
   */
  error: string | null;

  /**
   * Refetches supervisor information
   */
  refetchSupervisor: () => Promise<void>;
}

