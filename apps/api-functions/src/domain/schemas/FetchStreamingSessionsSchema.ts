/**
 * @fileoverview FetchStreamingSessionsSchema - Schema for FetchStreamingSessions requests
 * @summary Validates request payload for fetching streaming sessions
 * @description Provides Zod schema validation for streaming sessions requests
 */

import { z } from 'zod';

/**
 * Schema for validating FetchStreamingSessions requests
 * No specific parameters required as it uses authenticated user context
 */
export const fetchStreamingSessionsSchema = z.object({});

/**
 * Type for FetchStreamingSessions request payload
 */
export type FetchStreamingSessionsRequestPayload = z.infer<typeof fetchStreamingSessionsSchema>;
