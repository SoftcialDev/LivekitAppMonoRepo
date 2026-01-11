/**
 * @fileoverview Supervisors store - Zustand store for managing supervisors list
 * @summary Shared store for supervisors list with TTL caching
 * @description Stores supervisors list with TTL caching to prevent multiple API calls.
 * All SupervisorSelector components share this store, so only one fetch is made.
 */

import { create } from 'zustand';
import { getUsersByRole } from '@/modules/user-management/api/adminClient';
import { logError } from '@/shared/utils/logger';
import { SUPERVISORS_TTL_MS } from '../constants/supervisorsStoreConstants';
import type { ISupervisorsState } from './types';

/**
 * Supervisors store
 * 
 * Shared store for all SupervisorSelector components.
 * Only one fetch is made, and all components share the same data.
 */
let loadingPromise: Promise<void> | null = null;

export const useSupervisorsStore = create<ISupervisorsState>((set, get) => ({
  supervisors: [],
  loading: false,
  error: null,
  lastLoadedAt: null,

  loadSupervisors: async (force = false): Promise<void> => {
    const { loading, lastLoadedAt, supervisors } = get();
    const now = Date.now();

    // If there's already a loading promise, return it to prevent concurrent calls
    if (loadingPromise) {
      return loadingPromise;
    }

    // Return early if already loading (prevent concurrent calls)
    if (loading) {
      return;
    }

    // Return early if data is fresh (within TTL) and not forcing
    if (
      !force &&
      supervisors.length > 0 &&
      lastLoadedAt &&
      now - lastLoadedAt < SUPERVISORS_TTL_MS
    ) {
      return;
    }

    set({ loading: true, error: null });
    
    // Create and store the promise to prevent concurrent calls
    loadingPromise = (async () => {
      try {
        const response = await getUsersByRole('Supervisor', 1, 1000);
        set({
          supervisors: response.users,
          lastLoadedAt: Date.now(),
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load supervisors';
        set({
          error: errorMessage,
          supervisors: [],
        });
        logError('Failed to load supervisors', { error: err });
      } finally {
        set({ loading: false });
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  },

  invalidate: (): void => {
    set({ supervisors: [], lastLoadedAt: null, error: null });
  },
}));

