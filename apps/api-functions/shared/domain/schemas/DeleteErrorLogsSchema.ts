/**
 * @fileoverview DeleteErrorLogsSchema - Zod schema for error log deletion requests
 * @description Validates error log deletion request bodies
 */

import { z } from 'zod';

/**
 * Schema for deleting error logs (supports single ID or array of IDs)
 */
export const deleteErrorLogsSchema = z.object({
  ids: z.union([
    z.string().uuid('Invalid error log ID format'),
    z.array(z.string().uuid('Invalid error log ID format')).min(1, 'At least one error log ID is required')
  ])
});

export type DeleteErrorLogsParams = z.infer<typeof deleteErrorLogsSchema>;

