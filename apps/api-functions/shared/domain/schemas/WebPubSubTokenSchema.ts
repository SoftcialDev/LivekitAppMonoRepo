/**
 * @fileoverview WebPubSubTokenSchema - Schema for WebPubSub token generation requests
 * @summary Validation schema for WebPubSub token endpoint
 * @description Zod schema for validating WebPubSub token generation requests
 */

import { z } from "zod";

/**
 * Schema for WebPubSub token generation requests
 * @description No body parameters needed - uses caller ID from authentication
 */
export const webPubSubTokenSchema = z.object({
  // No body parameters required - uses caller ID from auth middleware
});

export type WebPubSubTokenParams = z.infer<typeof webPubSubTokenSchema>;
