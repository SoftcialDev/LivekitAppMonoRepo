/**
 * @fileoverview LivekitRecordingSchema - Zod schema for LivekitRecording requests
 * @summary Schema validation for LiveKit recording commands
 * @description Provides Zod schema for validating recording command requests
 */

import { z } from 'zod';
import { RecordingCommandType } from '@prisma/client';

/**
 * Zod schema for LiveKit recording command requests
 * 
 * @param command - Recording command type (START or STOP)
 * @param roomName - LiveKit room name for the recording
 */
export const livekitRecordingSchema = z.object({
  command: z.nativeEnum(RecordingCommandType, {
    errorMap: () => ({ message: "Command must be START or STOP" })
  }),
  roomName: z.string().min(1, "Room name is required"),
});

export type LivekitRecordingRequestPayload = z.infer<typeof livekitRecordingSchema>;

