/**
 * @fileoverview LiveKitTokenSchema - Schema for LiveKit token request validation
 * @summary Validation schema for LiveKit token endpoint
 * @description Defines the validation rules for LiveKit token requests including query parameters
 */

import { z } from "zod";

/**
 * Schema for validating LiveKit token query parameters
 * @description Validates the optional userId query parameter
 */
export const liveKitTokenSchema = z.object({
  userId: z.string().uuid("Invalid user ID format").optional(),
});

/**
 * Type for validated LiveKit token parameters
 */
export type LiveKitTokenParams = z.infer<typeof liveKitTokenSchema>;
