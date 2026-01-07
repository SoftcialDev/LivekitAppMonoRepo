/**
 * @fileoverview TalkSessionStartSchema - Schema for talk session start request validation
 * @summary Validation schema for talk session start requests
 * @description Defines the validation rules for talk session start requests
 */

import { z } from "zod";

/**
 * Schema for validating talk session start request body
 * @description Validates the psoEmail field for talk session start requests
 */
export const talkSessionStartSchema = z.object({
  psoEmail: z.string().email({
    message: "psoEmail must be a valid email address"
  })
});

/**
 * Type for validated talk session start parameters
 */
export type TalkSessionStartParams = z.infer<typeof talkSessionStartSchema>;

