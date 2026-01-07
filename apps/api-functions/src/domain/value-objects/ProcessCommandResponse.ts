/**
 * @fileoverview ProcessCommandResponse - Value object for process command responses
 * @summary Encapsulates process command response data
 * @description Represents the result of processing a command
 */

/**
 * Value object representing a process command response
 * @description Encapsulates the command ID, delivery status, and message
 */
export class ProcessCommandResponse {
  /**
   * Creates a new ProcessCommandResponse instance
   * @param commandId - The ID of the created pending command
   * @param delivered - Whether the command was delivered immediately
   * @param message - Success message
   */
  constructor(
    public readonly commandId: string,
    public readonly delivered: boolean,
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): { commandId: string; delivered: boolean; message: string } {
    return {
      commandId: this.commandId,
      delivered: this.delivered,
      message: this.message,
    };
  }
}
