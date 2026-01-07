/**
 * @fileoverview UpdateSnapshotReasonsBatchSchema.ts - Schema for batch updating snapshot reasons
 * @summary Validation schema for batch snapshot reason update endpoint
 * @description Zod schema for validating batch snapshot reason update requests
 */

import { z } from "zod";

/**
 * Schema for batch updating snapshot reasons.
 */
export const updateSnapshotReasonsBatchSchema = z.object({
  /** Array of snapshot reason updates */
  reasons: z.array(z.object({
    /** ID of the snapshot reason to update */
    id: z.string().uuid("Invalid reason ID format"),
    /** Human-readable label for the reason */
    label: z.string().min(1).max(200).optional(),
    /** Display order for the reason */
    order: z.number().int().min(0).optional(),
    /** Whether the reason is active */
    isActive: z.boolean().optional()
  })).min(1, "At least one reason update is required")
});

/**
 * Type for validated batch snapshot reason update parameters.
 */
export type UpdateSnapshotReasonsBatchParams = z.infer<typeof updateSnapshotReasonsBatchSchema>;

