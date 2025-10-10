/**
 * @fileoverview Command - Domain value object for camera commands
 * @description Represents a camera command with type, target employee, and timestamp
 */

import { CommandType } from '../enums/CommandType';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Value object representing a camera command
 */
export class Command {
  /**
   * Creates a new Command instance
   * @param type - The type of command (START or STOP)
   * @param employeeEmail - Email of the target employee
   * @param timestamp - When the command was created
   */
  constructor(
    public readonly type: CommandType,
    public readonly employeeEmail: string,
    public readonly timestamp: Date
  ) {}

  /**
   * Creates a Command from request data
   * @param commandData - Raw command data from request
   * @returns New Command instance
   */
  static fromRequest(commandData: { command: string; employeeEmail: string }): Command {
    return new Command(
      commandData.command as CommandType,
      commandData.employeeEmail.toLowerCase().trim(),
      getCentralAmericaTime()
    );
  }

  /**
   * Converts command to JSON payload for messaging
   * @returns JSON representation of the command
   */
  toPayload(): object {
    return {
      command: this.type,
      employeeEmail: this.employeeEmail,
      timestamp: this.timestamp.toISOString()
    };
  }
}
