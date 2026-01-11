/**
 * @fileoverview Snapshot reasons store types
 * @summary Type definitions for snapshot reasons store
 * @description Type definitions for the snapshot reasons Zustand store
 */

import type { SnapshotReason } from '@/modules/snapshots/types/snapshotTypes';

/**
 * Snapshot reasons store state interface
 */
export interface ISnapshotReasonsState {
  reasons: SnapshotReason[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadSnapshotReasons: (force?: boolean) => Promise<void>;
  invalidate: () => void;
}

