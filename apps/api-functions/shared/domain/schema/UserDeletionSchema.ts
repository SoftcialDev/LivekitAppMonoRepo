/**
 * @fileoverview UserDeletionSchema - Zod schema for user deletion validation
 * @description Validates user deletion request data
 */

import { z } from 'zod';
import { UserDeletionType } from '../enums/UserDeletionType';

/**
 * Zod schema for user deletion request validation
 */
export const userDeletionSchema = z.object({
  userEmail: z.string()
    .email('Invalid email format')
    .min(1, 'User email is required')
    .max(255, 'User email too long'),
  
  reason: z.string()
    .max(500, 'Reason too long')
    .optional()
});

/**
 * Type for validated user deletion request
 */
export type UserDeletionRequestData = z.infer<typeof userDeletionSchema>;
