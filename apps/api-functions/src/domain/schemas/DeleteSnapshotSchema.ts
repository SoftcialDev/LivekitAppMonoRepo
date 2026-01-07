/**
 * @fileoverview DeleteSnapshotSchema - Schema for snapshot deletion requests
 * @summary Validation schema for snapshot deletion endpoint
 * @description Zod schema for validating snapshot deletion requests
 */

import { z } from "zod";

/**
 * Schema for snapshot deletion requests
 * @description Validates the path parameter for deleting snapshots
 */
export const deleteSnapshotSchema = z.object({
  id: z.string().uuid("Invalid snapshot ID format")
});

export type DeleteSnapshotParams = z.infer<typeof deleteSnapshotSchema>;
