/**
 * @fileoverview DeleteContactManagerSchema - Domain schema for Contact Manager deletion validation
 * @summary Defines the validation schema for incoming Contact Manager deletion requests
 * @description Defines the validation schema for Contact Manager deletion requests using common UUID validation.
 */

import { z } from 'zod';
import { userIdSchema } from './CommonSchemas';

/**
 * Zod schema for validating the incoming Contact Manager deletion request path parameter.
 * Ensures that 'profileId' is a valid UUID string.
 */
export const deleteContactManagerSchema = z.object({
  /**
   * The UUID of the Contact Manager profile to delete.
   * @type {string}
   */
  profileId: userIdSchema,
});

/**
 * Type definition for the validated Contact Manager deletion request path parameter.
 */
export type DeleteContactManagerSchemaType = z.infer<typeof deleteContactManagerSchema>;
