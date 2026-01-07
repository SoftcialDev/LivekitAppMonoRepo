/**
 * @fileoverview DeleteRecordingSchema - Schema for delete recording request validation
 * @summary Validation schema for delete recording endpoint
 * @description Defines the validation rules for delete recording requests including path parameters
 */

import { z } from "zod";

/**
 * Schema for validating delete recording path parameters
 * @description Validates the recording ID from the URL path
 */
export const deleteRecordingSchema = z.object({
  id: z.string().uuid("Invalid recording ID format"),
});

/**
 * Type for validated delete recording parameters
 */
export type DeleteRecordingParams = z.infer<typeof deleteRecordingSchema>;
