/**
 * @fileoverview GetSupervisorForPsoSchema - Schema for supervisor lookup validation
 * @summary Validation schema for supervisor by PSO queries
 * @description Zod schema for validating supervisor lookup requests
 */

import { z } from "zod";

/**
 * Schema for supervisor lookup validation
 * @description Validates the query parameters for supervisor lookup by PSO identifier
 */
export const getSupervisorForPsoSchema = z.object({
  identifier: z.string().min(1, "Identifier is required")
});

export type GetSupervisorForPsoParams = z.infer<typeof getSupervisorForPsoSchema>;
