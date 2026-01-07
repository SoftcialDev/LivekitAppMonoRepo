/**
 * @fileoverview GetOrCreateChatSchema - Schema for chat creation requests
 * @summary Validation schema for chat creation endpoint
 * @description Zod schema for validating chat creation requests
 */

import { z } from "zod";

/**
 * Schema for chat creation requests
 * @description Validates the request body for creating or getting chats
 */
export const getOrCreateChatSchema = z.object({
  psoEmail: z.string().email("Invalid email format")
});

export type GetOrCreateChatParams = z.infer<typeof getOrCreateChatSchema>;
