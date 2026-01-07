/**
 * @fileoverview TalkSessionStopSchema - Schema for talk session stop request validation
 * @summary Validation schema for talk session stop requests
 * @description Defines the validation rules for talk session stop requests
 */

import { z } from "zod";
import { TalkStopReason } from "../enums/TalkStopReason";

/**
 * Schema for validating talk session stop request body
 * @description Validates the talkSessionId and stopReason fields for talk session stop requests
 */
export const talkSessionStopSchema = z.object({
  talkSessionId: z.string().uuid({
    message: "talkSessionId must be a valid UUID"
  }),
  stopReason: z.nativeEnum(TalkStopReason, {
    errorMap: () => ({ message: "stopReason must be a valid TalkStopReason enum value" })
  })
});

/**
 * Type for validated talk session stop parameters
 */
export type TalkSessionStopParams = z.infer<typeof talkSessionStopSchema>;

