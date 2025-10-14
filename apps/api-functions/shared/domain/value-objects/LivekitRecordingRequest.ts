/**
 * @fileoverview LivekitRecordingRequest - Value Object for LivekitRecording requests
 * @summary Encapsulates recording command parameters
 * @description Provides structured access to recording command parameters with validation
 */

import { LivekitRecordingRequestPayload } from '../schemas/LivekitRecordingSchema';
import { RecordingCommandType } from '@prisma/client';

/**
 * Value Object for LivekitRecording request parameters
 * 
 * @param command - Recording command type (START or STOP)
 * @param roomName - LiveKit room name for the recording
 */
export class LivekitRecordingRequest {
  constructor(
    public readonly command: RecordingCommandType,
    public readonly roomName: string
  ) {}

  /**
   * Creates a LivekitRecordingRequest from validated request body
   * @param payload - Validated request body from Zod schema
   * @returns LivekitRecordingRequest instance
   */
  static fromBody(payload: LivekitRecordingRequestPayload): LivekitRecordingRequest {
    return new LivekitRecordingRequest(
      payload.command,
      payload.roomName
    );
  }

  /**
   * Checks if the command is START
   * @returns True if command is START
   */
  isStartCommand(): boolean {
    return this.command === RecordingCommandType.START;
  }

  /**
   * Checks if the command is STOP
   * @returns True if command is STOP
   */
  isStopCommand(): boolean {
    return this.command === RecordingCommandType.STOP;
  }
}
