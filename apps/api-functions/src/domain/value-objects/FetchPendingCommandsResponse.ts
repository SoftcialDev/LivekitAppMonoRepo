/**
 * @fileoverview FetchPendingCommandsResponse - Value Object for FetchPendingCommands responses
 * @summary Encapsulates the response data for fetching pending commands
 * @description Represents the response data structure for the FetchPendingCommands endpoint
 */

import { PendingCommand } from '../entities/PendingCommand';

/**
 * Interface for the response payload
 */
export interface FetchPendingCommandsResponsePayload {
  pending: PendingCommand | null;
}

/**
 * Value Object for FetchPendingCommands responses
 */
export class FetchPendingCommandsResponse {
  constructor(
    public readonly pending: PendingCommand | null
  ) {}

  /**
   * Creates a FetchPendingCommandsResponse with pending command data
   * @param pending - The pending command entity or null
   * @returns FetchPendingCommandsResponse instance
   */
  static withPending(pending: PendingCommand): FetchPendingCommandsResponse {
    return new FetchPendingCommandsResponse(pending);
  }

  /**
   * Creates a FetchPendingCommandsResponse with no pending commands
   * @returns FetchPendingCommandsResponse instance with null pending
   */
  static withNoPending(): FetchPendingCommandsResponse {
    return new FetchPendingCommandsResponse(null);
  }

  /**
   * Converts the response to payload format
   * @returns The response payload
   */
  toPayload(): FetchPendingCommandsResponsePayload {
    return {
      pending: this.pending
    };
  }
}
