/**
 * @fileoverview SupervisorAssignmentSchema - Domain schema for supervisor assignment validation
 * @description Defines the validation schema for supervisor assignment requests
 */

import { z } from "zod";

/**
 * Zod schema for validating the supervisor assignment request body.
 * Ensures that 'userEmails' is a non-empty array of valid emails and 'newSupervisorEmail' is a valid email or null.
 */
export const supervisorAssignmentSchema = z.object({
  /**
   * Array of user emails to assign supervisor to.
   * @type {string[]}
   */
  userEmails: z.array(z.string().email()).min(1, "At least one user email is required"),
  
  /**
   * Email of the new supervisor (null for unassign).
   * @type {string | null}
   */
  newSupervisorEmail: z.string().email().nullable(),
});

/**
 * Type definition for the validated supervisor assignment request body.
 */
export type SupervisorAssignmentRequest = z.infer<typeof supervisorAssignmentSchema>;
