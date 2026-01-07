/**
 * @fileoverview GetErrorLogByIdSchema - Zod schema for error log ID path parameter
 * @description Validates error log ID path parameters
 */

import { z } from 'zod';

/**
 * Schema for error log ID path parameter
 */
export const getErrorLogByIdSchema = z.object({
  id: z.string().uuid('Invalid error log ID format')
});

export type GetErrorLogByIdParams = z.infer<typeof getErrorLogByIdSchema>;

