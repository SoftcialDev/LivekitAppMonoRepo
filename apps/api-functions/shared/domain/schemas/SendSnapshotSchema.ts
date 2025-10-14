/**
 * @fileoverview SendSnapshotSchema - Schema for snapshot report requests
 * @summary Validation schema for snapshot report endpoint
 * @description Zod schema for validating snapshot report requests
 */

import { z } from "zod";

/**
 * Schema for snapshot report requests
 * @description Validates the request body for sending snapshot reports
 */
export const sendSnapshotSchema = z.object({
  /** The PSO's email address (case-insensitive), used to look up the PSO user record */
  psoEmail: z.string().email("Invalid email format"),
  /** Text reason or details provided by the supervisor */
  reason: z.string().min(1, "Reason is required"),
  /** Base64-encoded JPEG snapshot image */
  imageBase64: z.string().min(1, "Image is required")
});

export type SendSnapshotParams = z.infer<typeof sendSnapshotSchema>;
