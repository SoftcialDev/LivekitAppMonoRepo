/**
 * @fileoverview GetSupervisorByIdentifierSchema - Schema for supervisor lookup validation
 * @summary Validation schema for supervisor identifier queries
 * @description Zod schema for validating supervisor identifier requests
 */

import { z } from "zod";

/**
 * Schema for supervisor identifier validation
 * @description Validates the identifier parameter for supervisor lookup
 */
export const getSupervisorByIdentifierSchema = z.object({
  identifier: z.string().min(1, "Identifier is required")
});

export type GetSupervisorByIdentifierParams = z.infer<typeof getSupervisorByIdentifierSchema>;
