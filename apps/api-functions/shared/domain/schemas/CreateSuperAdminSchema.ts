/**
 * @fileoverview CreateSuperAdminSchema - Domain schema for Super Admin creation validation
 * @summary Defines the validation schema for incoming Super Admin creation requests
 * @description Defines the validation schema for Super Admin creation requests using common email validation.
 */

import { z } from 'zod';
import { emailSchema } from './CommonSchemas';

/**
 * Zod schema for validating the incoming Super Admin creation request body.
 * Ensures that 'email' is a valid email string.
 */
export const createSuperAdminSchema = z.object({
  /**
   * The email address of the user to promote to Super Admin.
   * @type {string}
   */
  email: emailSchema,
});

/**
 * Type definition for the validated Super Admin creation request body.
 */
export type CreateSuperAdminRequest = z.infer<typeof createSuperAdminSchema>;
