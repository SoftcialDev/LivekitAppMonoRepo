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
   * @param reason - Optional reason for the command (for STOP commands)
   */
  constructor(
    public readonly type: CommandType,
    public readonly employeeEmail: string,
    public readonly timestamp: Date,
    public readonly reason?: string
  ) {
    // Freeze the object to prevent runtime modifications
    Object.freeze(this);
  }

  /**
   * Creates a Command from request data
   * @param commandData - Raw command data from request
   * @returns New Command instance
   */
  static fromRequest(commandData: { command: string; employeeEmail: string; reason?: string }): Command {
    return new Command(
      commandData.command as CommandType,
      commandData.employeeEmail.toLowerCase().trim(),
      getCentralAmericaTime(),
      commandData.reason
    );
  }

  /**
   * Converts command to JSON payload for messaging
   * @returns JSON representation of the command
   */
  toPayload(): object {
    const payload: any = {
      command: this.type,
      employeeEmail: this.employeeEmail,
      timestamp: this.timestamp.toISOString()
    };
    
    if (this.reason) {
      payload.reason = this.reason;
    }
    
    return payload;
  }
}
