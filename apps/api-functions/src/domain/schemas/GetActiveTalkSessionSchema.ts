/**
 * @fileoverview GetActiveTalkSessionSchema - Zod schema for GetActiveTalkSession query parameters
 * @summary Validates query parameters for getting active talk session
 * @description Defines the validation schema for query parameters when checking active talk sessions
 */

import { z } from 'zod';

/**
 * Schema for GetActiveTalkSession query parameters
 */
export const getActiveTalkSessionSchema = z.object({
  psoEmail: z.string().email('Invalid email format').toLowerCase().trim()
});

/**
 * Type inferred from getActiveTalkSessionSchema
 */
export type GetActiveTalkSessionParams = z.infer<typeof getActiveTalkSessionSchema>;

