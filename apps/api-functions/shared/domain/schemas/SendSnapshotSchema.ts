/**
 * @fileoverview SendSnapshotSchema.ts - Schema for snapshot report requests
 * @summary Validation schema for snapshot report endpoint
 * @description Zod schema for validating snapshot report requests with predefined
 * reasons and conditional description field.
 */

import { z } from "zod";
import { SnapshotReason } from "../enums/SnapshotReason";

/**
 * Schema for snapshot report requests.
 * @description Validates the request body for sending snapshot reports.
 * Requires a predefined reason from the SnapshotReason enum, and conditionally
 * requires a description when the reason is "OTHER".
 */
export const sendSnapshotSchema = z.object({
  /** The PSO's email address (case-insensitive), used to look up the PSO user record */
  psoEmail: z.string().email("Invalid email format"),
  /** Predefined reason for the snapshot report */
  reason: z.nativeEnum(SnapshotReason, {
    errorMap: () => ({ message: "Invalid reason. Must be one of the predefined reasons." })
  }),
  /** Optional description, required when reason is "OTHER" */
  description: z.string().optional(),
  /** Base64-encoded JPEG snapshot image */
  imageBase64: z.string().min(1, "Image is required")
}).refine(
  (data) => {
    if (data.reason === SnapshotReason.OTHER) {
      return data.description !== undefined && data.description.trim().length > 0;
    }
    return true;
  },
  {
    message: "Description is required when reason is 'Other'",
    path: ["description"]
  }
);

/**
 * Type for validated snapshot report parameters.
 */
export type SendSnapshotParams = z.infer<typeof sendSnapshotSchema>;
