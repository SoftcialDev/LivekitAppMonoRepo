/**
 * @fileoverview ProcessCommandRequest - Value object for process command requests
 * @summary Encapsulates process command request data
 * @description Represents a request to process a command from Service Bus
 */

import { ProcessCommandParams } from "../schemas/ProcessCommandSchema";
import { CommandType } from "../enums/CommandType";

/**
 * Value object representing a process command request
 * @description Encapsulates the command, employee email, and timestamp
 */
export class ProcessCommandRequest {
  /**
   * Creates a new ProcessCommandRequest instance
   * @param command - The command type (START or STOP)
   * @param employeeEmail - The email of the employee
   * @param timestamp - When the command was issued
   * @param reason - Optional reason for the command (mainly for STOP commands)
   */
  constructor(
    public readonly command: CommandType,
    public readonly employeeEmail: string,
    public readonly timestamp: Date,
    public readonly reason?: string
  ) {}

  /**
   * Creates a ProcessCommandRequest from validated message parameters
   * @param params - Validated message parameters
   * @returns A new ProcessCommandRequest instance
   */
  static fromMessage(params: ProcessCommandParams): ProcessCommandRequest {
    return new ProcessCommandRequest(
      params.command as CommandType,
      params.employeeEmail,
      new Date(params.timestamp),
      params.reason
    );
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { command: CommandType; employeeEmail: string; timestamp: Date; reason?: string } {
    return {
      command: this.command,
      employeeEmail: this.employeeEmail,
      timestamp: this.timestamp,
      reason: this.reason,
    };
  }
}
