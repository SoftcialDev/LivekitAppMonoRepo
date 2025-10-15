/**
 * @fileoverview RecordingCommand - Domain entity for recording commands
 * @summary Encapsulates recording command business logic and data
 * @description Represents a LiveKit recording command with all associated metadata and business rules
 */

import { RecordingCommandType } from '@prisma/client';

/**
 * Domain entity for recording commands
 * 
 * @param command - Recording command type (START or STOP)
 * @param roomName - LiveKit room name where recording will occur
 * @param initiatorUserId - User who initiated the recording command
 * @param subjectUserId - User being recorded (subject)
 * @param subjectLabel - Human-readable label for the subject
 */
export class RecordingCommand {
  constructor(
    public readonly command: RecordingCommandType,
    public readonly roomName: string,
    public readonly initiatorUserId: string,
    public readonly subjectUserId: string,
    public readonly subjectLabel: string
  ) {}

  /**
   * Creates RecordingCommand from request and resolved user data
   * @param command - Recording command type
   * @param roomName - LiveKit room name
   * @param initiatorUserId - User who initiated the command
   * @param subjectUserId - User being recorded
   * @param subjectLabel - Human-readable label for subject
   * @returns RecordingCommand entity instance
   */
  static create(
    command: RecordingCommandType,
    roomName: string,
    initiatorUserId: string,
    subjectUserId: string,
    subjectLabel: string
  ): RecordingCommand {
    return new RecordingCommand(
      command,
      roomName,
      initiatorUserId,
      subjectUserId,
      subjectLabel
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

  /**
   * Validates that the command has all required data
   * @returns True if command is valid
   */
  isValid(): boolean {
    return !!(
      this.command &&
      this.roomName &&
      this.initiatorUserId &&
      this.subjectUserId &&
      this.subjectLabel
    );
  }

  /**
   * Converts entity to payload format for logging or API responses
   * @returns Structured payload representation
   */
  toPayload(): {
    command: string;
    roomName: string;
    initiatorUserId: string;
    subjectUserId: string;
    subjectLabel: string;
  } {
    return {
      command: this.command,
      roomName: this.roomName,
      initiatorUserId: this.initiatorUserId,
      subjectUserId: this.subjectUserId,
      subjectLabel: this.subjectLabel,
    };
  }
}

