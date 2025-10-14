/**
 * @fileoverview GetSnapshotsSchema - Schema for snapshot retrieval requests
 * @summary Validation schema for snapshot retrieval endpoint
 * @description Zod schema for validating snapshot retrieval requests
 */

import { z } from "zod";

/**
 * Schema for snapshot retrieval requests
 * @description Validates the request for getting all snapshots
 */
export const getSnapshotsSchema = z.object({
  // No query parameters needed - returns all snapshots
});

export type GetSnapshotsParams = z.infer<typeof getSnapshotsSchema>;
