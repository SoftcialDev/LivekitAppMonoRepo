/**
 * @fileoverview CreateSnapshotReasonSchema.ts - Schema for creating snapshot reasons
 * @summary Validation schema for snapshot reason creation endpoint
 * @description Zod schema for validating snapshot reason creation requests
 */

import { z } from "zod";

/**
 * Schema for creating snapshot reasons.
 */
export const createSnapshotReasonSchema = z.object({
  /** Human-readable label for the reason */
  label: z.string().min(1, "Label is required").max(200, "Label must be less than 200 characters"),
  /** Unique code for the reason (uppercase, alphanumeric with underscores) */
  code: z.string()
    .min(1, "Code is required")
    .max(50, "Code must be less than 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase alphanumeric with underscores only"),
  /** Display order for the reason */
  order: z.number().int().min(0, "Order must be a non-negative integer")
});

/**
 * Type for validated snapshot reason creation parameters.
 */
export type CreateSnapshotReasonParams = z.infer<typeof createSnapshotReasonSchema>;

