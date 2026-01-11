/**
 * @fileoverview Track transition types
 * @summary Type definitions for track transition utilities
 * @description Types for managing smooth track transitions
 */

/**
 * Pending unpublish entry
 */
export interface IPendingUnpublish {
  trackSid: string;
  timeout: NodeJS.Timeout;
}

/**
 * Map of pending unpublish operations
 */
export type PendingUnpublishMap = Map<string, IPendingUnpublish>;

