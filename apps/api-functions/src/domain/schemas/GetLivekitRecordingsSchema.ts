/**
 * @fileoverview GetLivekitRecordingsSchema - Zod schema for GetLivekitRecordings requests
 * @summary Schema validation for recording session queries
 * @description Provides Zod schema for validating query parameters when fetching LiveKit recordings
 */

import { z } from 'zod';

/**
 * Zod schema for query parameters to list recordings
 * 
 * @param roomName - Optional room name filter
 * @param limit - Maximum number of recordings to return (1-200, default 50)
 * @param order - Sort order for recordings (asc/desc, default desc)
 * @param includeSas - Whether to include SAS URLs for playback (default true)
 * @param sasMinutes - SAS URL validity in minutes (default 60)
 */
export const getLivekitRecordingsSchema = z.object({
  roomName: z.string().min(1, "Room name must not be empty").optional(),
  limit: z.coerce.number().int().positive().max(1000, "Limit cannot exceed 1000").default(50),
  order: z.enum(["asc", "desc"], {
    errorMap: () => ({ message: "Order must be 'asc' or 'desc'" })
  }).default("desc"),
  includeSas: z.coerce.boolean().default(true),
  sasMinutes: z.coerce.number().int().positive().default(60),
});

export type GetLivekitRecordingsRequestPayload = z.infer<typeof getLivekitRecordingsSchema>;
