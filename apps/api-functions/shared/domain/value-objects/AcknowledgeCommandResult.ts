/**
 * @fileoverview AcknowledgeCommandResult - Value object for command acknowledgment results
 * @description Represents the result of acknowledging pending commands
 */

import { getCentralAmericaTime } from '../../utils/dateUtils';

export interface AcknowledgeCommandResultPayload {
  updatedCount: number;
}

/**
 * Value object representing the result of acknowledging commands
 */
export class AcknowledgeCommandResult {
  public readonly updatedCount: number;
  public readonly timestamp: Date;

  constructor(updatedCount: number) {
    if (updatedCount < 0) {
      throw new Error('Updated count cannot be negative');
    }

    this.updatedCount = updatedCount;
    this.timestamp = getCentralAmericaTime();
  }

  /**
   * Creates an AcknowledgeCommandResult from database result
   * @param updatedCount - Number of commands successfully acknowledged
   * @returns AcknowledgeCommandResult instance
   */
  static fromDatabaseResult(updatedCount: number): AcknowledgeCommandResult {
    return new AcknowledgeCommandResult(updatedCount);
  }

  /**
   * Converts to payload format for API response
   * @returns Payload representation
   */
  toPayload(): AcknowledgeCommandResultPayload {
    return {
      updatedCount: this.updatedCount
    };
  }
}
