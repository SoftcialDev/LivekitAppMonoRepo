/**
 * @fileoverview PresenceUpdateSchema - Schema for presence update request validation
 * @summary Validation schema for presence update endpoint
 * @description Defines the validation rules for presence update requests including body parameters
 */

import { z } from "zod";

/**
 * Schema for validating presence update request body
 * @description Validates the status field and optional platform for presence updates
 */
export const presenceUpdateSchema = z.object({
  status: z.enum(["online", "offline"], {
    errorMap: () => ({ message: "Status must be either 'online' or 'offline'" })
  }),
  platform: z.enum(["electron", "browser"]).optional()
});

/**
 * Type for validated presence update parameters
 */
export type PresenceUpdateParams = z.infer<typeof presenceUpdateSchema>;
