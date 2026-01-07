/**
 * @fileoverview GetWebsocketPresenceStatusSchema - Validation schema for presence status query parameters
 * @summary Zod schema for validating presence status endpoint query parameters
 * @description Validates pagination parameters for the presence status endpoint
 */

import { z } from 'zod';

/**
 * Schema for validating presence status query parameters
 * @description Validates page and pageSize as positive integers
 */
export const getWebsocketPresenceStatusSchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
});

/**
 * Inferred type from the presence status query schema
 */
export type GetWebsocketPresenceStatusQuery = z.infer<typeof getWebsocketPresenceStatusSchema>;

