/**
 * @fileoverview UpdateSnapshotReasonSchema.ts - Schema for updating snapshot reasons
 * @summary Validation schema for snapshot reason update endpoint
 * @description Zod schema for validating snapshot reason update requests
 */

import { z } from "zod";

/**
 * Schema for updating snapshot reasons.
 */
export const updateSnapshotReasonSchema = z.object({
  /** ID of the snapshot reason to update */
  id: z.string().uuid("Invalid reason ID format"),
  /** Human-readable label for the reason */
  label: z.string().min(1).max(200).optional(),
  /** Unique code for the reason */
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/).optional(),
  /** Display order for the reason */
  order: z.number().int().min(0).optional(),
  /** Whether the reason is active */
  isActive: z.boolean().optional()
});

/**
 * Type for validated snapshot reason update parameters.
 */
export type UpdateSnapshotReasonParams = z.infer<typeof updateSnapshotReasonSchema>;

