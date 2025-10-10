/**
 * @fileoverview UserRoleChangeSchema - Domain schema for user role change validation
 * @description Defines the validation schema for incoming user role change requests
 */

import { z } from "zod";
import { UserRole } from '@prisma/client';

/**
 * Zod schema for validating the incoming user role change request body.
 * Ensures that 'userEmail' is a valid email string and 'newRole' is a valid UserRole or null.
 */
export const userRoleChangeSchema = z.object({
  /**
   * The email address of the user whose role is being changed.
   * @type {string}
   */
  userEmail: z.string().email("Invalid email format"),
  
  /**
   * The new role to assign.
   * @type {UserRole}
   */
  newRole: z.nativeEnum(UserRole),
});

/**
 * Type definition for the validated user role change request body.
 */
export type UserRoleChangeRequest = z.infer<typeof userRoleChangeSchema>;
