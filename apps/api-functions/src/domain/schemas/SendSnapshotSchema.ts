/**
 * @fileoverview SendSnapshotSchema.ts - Schema for snapshot report requests
 * @summary Validation schema for snapshot report endpoint
 * @description Zod schema for validating snapshot report requests with predefined
 * reasons and conditional description field.
 */

import { z } from "zod";

/**
 * Schema for snapshot report requests.
 * @description Validates the request body for sending snapshot reports.
 * Requires a reasonId (UUID) that references a SnapshotReason, and conditionally
 * requires a description when the reason code is "OTHER".
 */
export const sendSnapshotSchema = z.object({
  /** The PSO's email address (case-insensitive), used to look up the PSO user record */
  psoEmail: z.string().email("Invalid email format"),
  /** ID of the snapshot reason (UUID) */
  reasonId: z.string().uuid("Invalid reason ID format"),
  /** Optional description, required when reason code is "OTHER" */
  description: z.string().optional(),
  /** Base64-encoded JPEG snapshot image */
  imageBase64: z.string().min(1, "Image is required")
});

/**
 * Type for validated snapshot report parameters.
 */
export type SendSnapshotParams = z.infer<typeof sendSnapshotSchema>;
