/**
 * @fileoverview WebSocketEventSchema - Schema for WebSocket event validation
 * @summary Validation schema for WebSocket events
 * @description Zod schema for validating WebSocket connection/disconnection events
 */

import { z } from "zod";

/**
 * Schema for WebSocket event validation
 * @description Validates the connection context for WebSocket events
 */
export const webSocketEventSchema = z.object({
  connectionContext: z.object({
    userId: z.string().min(1, "User ID is required"),
    eventType: z.string().optional(),
    eventName: z.string().optional()
  })
});

export type WebSocketEventParams = z.infer<typeof webSocketEventSchema>;
