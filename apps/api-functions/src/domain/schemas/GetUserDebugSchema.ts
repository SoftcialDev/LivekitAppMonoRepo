/**
 * @fileoverview GetUserDebugSchema - Schema for user debug query validation
 * @summary Validation schema for user debug endpoint query parameters
 * @description Zod schema for validating user identifier query parameter
 */

import { z } from 'zod';

/**
 * Schema for user debug query validation
 * @description Validates the userIdentifier parameter (email or Azure AD Object ID)
 */
export const getUserDebugSchema = z.object({
  userIdentifier: z.string().min(1, 'User identifier is required')
});

/**
 * Inferred type from the user debug query schema
 */
export type GetUserDebugQuery = z.infer<typeof getUserDebugSchema>;

