/**
 * @fileoverview FetchStreamingSessionHistorySchema - Schema for FetchStreamingSessionHistory requests
 * @summary Validates request payload for fetching streaming session history
 * @description Provides Zod schema validation for streaming session history requests
 */

import { z } from 'zod';

/**
 * Schema for validating FetchStreamingSessionHistory requests
 * No specific parameters required as it uses authenticated user context
 */
export const fetchStreamingSessionHistorySchema = z.object({});

/**
 * Type for FetchStreamingSessionHistory request payload
 */
export type FetchStreamingSessionHistoryRequestPayload = z.infer<typeof fetchStreamingSessionHistorySchema>;
