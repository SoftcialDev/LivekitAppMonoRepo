/**
 * @fileoverview DeleteSuperAdminSchema - Domain schema for Super Admin deletion validation
 * @summary Defines the validation schema for incoming Super Admin deletion requests
 * @description Defines the validation schema for Super Admin deletion requests using common UUID validation.
 */

import { z } from 'zod';

/**
 * Zod schema for validating the incoming Super Admin deletion request path parameter.
 * Ensures that 'userId' is a valid string (Azure AD Object ID or UUID).
 */
export const deleteSuperAdminSchema = z.object({
  /**
   * The Azure AD Object ID or UUID of the user to remove Super Admin role from.
   * @type {string}
   */
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Type definition for the validated Super Admin deletion request path parameter.
 */
export type DeleteSuperAdminSchemaType = z.infer<typeof deleteSuperAdminSchema>;
