/**
 * @fileoverview TransferPsosSchema - Schema for PSO transfer requests
 * @summary Validation schema for PSO transfer endpoint
 * @description Zod schema for validating PSO transfer requests
 */

import { z } from "zod";

/**
 * Schema for PSO transfer requests
 * @description Validates the request body for transferring PSOs to a new supervisor
 */
export const transferPsosSchema = z.object({
  newSupervisorEmail: z.string().email("Invalid email format")
});

export type TransferPsosParams = z.infer<typeof transferPsosSchema>;
