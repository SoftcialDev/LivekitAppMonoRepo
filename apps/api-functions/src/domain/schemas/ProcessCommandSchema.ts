/**
 * @fileoverview ProcessCommandSchema - Schema for process command message validation
 * @summary Validation schema for process command messages
 * @description Defines the validation rules for process command messages from Service Bus
 */

import { z } from "zod";

/**
 * Schema for validating process command messages
 * @description Validates the command, employeeEmail, timestamp, and reason fields
 */
export const processCommandSchema = z.object({
  command: z.enum(["START", "STOP"], {
    errorMap: () => ({ message: "Command must be either 'START' or 'STOP'" })
  }),
  employeeEmail: z.string().email({
    message: "Employee email must be a valid email address"
  }),
  timestamp: z.string().datetime({
    message: "Timestamp must be a valid ISO datetime string"
  }),
  reason: z.string().optional()
});

/**
 * Type for validated process command parameters
 */
export type ProcessCommandParams = z.infer<typeof processCommandSchema>;
