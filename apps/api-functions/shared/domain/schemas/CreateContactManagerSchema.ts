/**
 * @fileoverview CreateContactManagerSchema - Domain schema for contact manager creation validation
 * @description Defines the validation schema for incoming contact manager creation requests
 */

import { z } from 'zod';
import { ContactManagerStatus } from '@prisma/client';

/**
 * Zod schema for validating the incoming contact manager creation request body.
 * Ensures that 'email' is a valid email string and 'status' is a valid ContactManagerStatus.
 */
export const createContactManagerSchema = z.object({
  /**
   * The email address of the user to promote to Contact Manager.
   * @type {string}
   */
  email: z.string().email("Invalid email format"),
  
  /**
   * The initial status for the new Contact Manager.
   * @type {ContactManagerStatus}
   */
  status: z.nativeEnum(ContactManagerStatus),
});

/**
 * Type definition for the validated contact manager creation request body.
 */
export type CreateContactManagerRequest = z.infer<typeof createContactManagerSchema>;
