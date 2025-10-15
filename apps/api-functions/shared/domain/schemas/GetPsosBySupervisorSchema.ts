/**
 * @fileoverview GetPsosBySupervisorSchema - Schema for PSOs lookup validation
 * @summary Validation schema for PSOs by supervisor queries
 * @description Zod schema for validating PSOs by supervisor requests
 */

import { z } from "zod";

/**
 * Schema for PSOs by supervisor validation
 * @description Validates the query parameters for PSOs lookup
 */
export const getPsosBySupervisorSchema = z.object({
  supervisorId: z.string().optional()
});

export type GetPsosBySupervisorParams = z.infer<typeof getPsosBySupervisorSchema>;
