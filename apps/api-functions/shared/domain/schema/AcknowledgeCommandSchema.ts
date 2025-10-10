/**
 * @fileoverview AcknowledgeCommandSchema - Zod schema for command acknowledgment validation
 * @description Validates command acknowledgment request parameters
 */

import { z } from "zod";

/**
 * Zod schema for command acknowledgment request validation
 */
export const acknowledgeCommandSchema = z.object({
  ids: z.array(z.string().uuid())
    .min(1, 'At least one command ID is required')
    .max(100, 'Maximum 100 command IDs allowed')
});

export type AcknowledgeCommandRequestData = z.infer<typeof acknowledgeCommandSchema>;
