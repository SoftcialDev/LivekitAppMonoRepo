/**
 * @fileoverview PresenceUpdateSchema - Schema for presence update request validation
 * @summary Validation schema for presence update endpoint
 * @description Defines the validation rules for presence update requests including body parameters
 */

import { z } from "zod";

/**
 * Schema for validating presence update request body
 * @description Validates the status field for presence updates
 */
export const presenceUpdateSchema = z.object({
  status: z.enum(["online", "offline"], {
    errorMap: () => ({ message: "Status must be either 'online' or 'offline'" })
  })
});

/**
 * Type for validated presence update parameters
 */
export type PresenceUpdateParams = z.infer<typeof presenceUpdateSchema>;
