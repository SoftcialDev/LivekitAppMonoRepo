/**
 * @fileoverview DeleteErrorLogsSchema - Zod schema for error log deletion requests
 * @description Validates error log deletion request bodies
 */

import { z } from 'zod';

/**
 * Schema for deleting error logs (supports single ID, array of IDs, or deleteAll flag)
 */
export const deleteErrorLogsSchema = z.object({
  ids: z.union([
    z.string().uuid('Invalid error log ID format'),
    z.array(z.string().uuid('Invalid error log ID format')).min(1, 'At least one error log ID is required')
  ]).optional(),
  deleteAll: z.boolean().optional()
}).refine(
  (data) => data.deleteAll === true || (data.ids !== undefined && data.ids !== null),
  {
    message: 'Either ids or deleteAll must be provided'
  }
);

export type DeleteErrorLogsParams = z.infer<typeof deleteErrorLogsSchema>;

