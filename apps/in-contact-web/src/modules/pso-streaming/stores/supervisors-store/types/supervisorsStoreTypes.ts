/**
 * @fileoverview Supervisors store types
 * @summary Type definitions for supervisors store
 * @description Type definitions for the supervisors Zustand store
 */

import type { UserByRole } from '@/modules/user-management/types';

/**
 * Supervisors store state interface
 */
export interface ISupervisorsState {
  supervisors: UserByRole[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadSupervisors: (force?: boolean) => Promise<void>;
  invalidate: () => void;
}

