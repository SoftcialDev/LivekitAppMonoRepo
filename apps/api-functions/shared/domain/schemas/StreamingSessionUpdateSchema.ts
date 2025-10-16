/**
 * @fileoverview StreamingSessionUpdateSchema - Schema for streaming session update request validation
 * @summary Validation schema for streaming session update requests
 * @description Defines the validation rules for streaming session update requests including body parameters
 */

import { z } from "zod";

/**
 * Schema for validating streaming session update request body
 * @description Validates the status, isCommand, and reason fields for streaming session updates
 */
export const streamingSessionUpdateSchema = z.object({
  status: z.enum(["started", "stopped"], {
    errorMap: () => ({ message: "Status must be either 'started' or 'stopped'" })
  }),
  isCommand: z.boolean().optional(),
  reason: z.string().optional()
});

/**
 * Type for validated streaming session update parameters
 */
export type StreamingSessionUpdateParams = z.infer<typeof streamingSessionUpdateSchema>;
