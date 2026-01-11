/**
 * @fileoverview Snapshot reasons store - Zustand store for managing snapshot reasons list
 * @summary Shared store for snapshot reasons list with TTL caching
 * @description Stores snapshot reasons list with TTL caching to prevent multiple API calls.
 * All components that need snapshot reasons share this store, so only one fetch is made.
 */

import { create } from 'zustand';
import { SnapshotReasonsClient } from '../../api/snapshotReasonsClient';
import type { SnapshotReason } from '@/modules/snapshots/types/snapshotTypes';
import { logError } from '@/shared/utils/logger';
import { SNAPSHOT_REASONS_TTL_MS } from '../../constants/snapshotReasonsStoreConstants';
import type { ISnapshotReasonsState } from './types/snapshotReasonsStoreTypes';

/**
 * Snapshot reasons store
 * 
 * Shared store for all components that need snapshot reasons.
 * Only one fetch is made, and all components share the same data.
 */
let loadingPromise: Promise<void> | null = null;

export const useSnapshotReasonsStore = create<ISnapshotReasonsState>((set, get) => ({
  reasons: [],
  loading: false,
  error: null,
  lastLoadedAt: null,

  loadSnapshotReasons: async (force = false): Promise<void> => {
    const { loading, lastLoadedAt, reasons } = get();
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
      reasons.length > 0 &&
      lastLoadedAt &&
      now - lastLoadedAt < SNAPSHOT_REASONS_TTL_MS
    ) {
      return;
    }

    set({ loading: true, error: null });
    
    // Create and store the promise to prevent concurrent calls
    loadingPromise = (async () => {
      try {
        const client = new SnapshotReasonsClient();
        const reasonsData = await client.getSnapshotReasons();
        set({
          reasons: reasonsData,
          lastLoadedAt: Date.now(),
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load snapshot reasons';
        set({
          error: errorMessage,
          reasons: [],
        });
        logError('Failed to load snapshot reasons', { error: err });
      } finally {
        set({ loading: false });
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  },

  invalidate: (): void => {
    set({ reasons: [], lastLoadedAt: null, error: null });
  },
}));

