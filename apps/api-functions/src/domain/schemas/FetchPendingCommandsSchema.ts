/**
 * @fileoverview FetchPendingCommandsSchema - Zod schema for FetchPendingCommands requests
 * @summary Validation schema for fetching pending commands
 * @description Provides validation for the FetchPendingCommands endpoint request parameters
 */

import { z } from 'zod';

/**
 * Schema for validating FetchPendingCommands requests
 * This endpoint doesn't require any specific parameters as it fetches commands for the authenticated user
 */
export const fetchPendingCommandsSchema = z.object({
});

export type FetchPendingCommandsRequestPayload = z.infer<typeof fetchPendingCommandsSchema>;
