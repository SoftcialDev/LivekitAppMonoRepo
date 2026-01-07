/**
 * @fileoverview GetTalkSessionsSchema.ts - Schema for talk sessions query requests
 * @summary Validation schema for talk sessions query endpoint
 * @description Zod schema for validating talk sessions query requests with pagination
 */

import { z } from "zod";

/**
 * Schema for talk sessions query requests.
 * @description Validates query parameters for retrieving talk sessions with pagination.
 */
export const getTalkSessionsSchema = z.object({
  /** Page number (1-based) */
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val >= 1, 'Page must be at least 1'),
  /** Number of items per page */
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 10)
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
});

/**
 * Type for validated talk sessions query parameters.
 */
export type GetTalkSessionsParams = z.infer<typeof getTalkSessionsSchema>;

