/**
 * @fileoverview UpdateContactManagerStatusSchema - Domain schema for Contact Manager status update validation
 * @description Defines the validation schema for incoming Contact Manager status update requests
 */

import { z } from 'zod';

/**
 * Zod schema for validating the incoming Contact Manager status update request body.
 * Ensures that 'status' is a valid ContactManagerStatus enum value.
 */
export const updateContactManagerStatusSchema = z.object({
  /**
   * The new status to set for the Contact Manager.
   * @type {string}
   */
  status: z.enum(["Unavailable", "Available", "OnBreak", "OnAnotherTask"], {
    errorMap: () => ({ message: "Status must be one of: Unavailable, Available, OnBreak, OnAnotherTask" })
  }),
});

/**
 * Type definition for the validated Contact Manager status update request body.
 */
export type UpdateContactManagerStatusRequestPayload = z.infer<typeof updateContactManagerStatusSchema>;
