/**
 * @fileoverview FetchPendingCommandsRequest - Value Object for FetchPendingCommands requests
 * @summary Encapsulates the request data for fetching pending commands
 * @description Represents the request data structure for the FetchPendingCommands endpoint
 */

import { FetchPendingCommandsRequestPayload } from '../schemas/FetchPendingCommandsSchema';

/**
 * Value Object for FetchPendingCommands requests
 * This request doesn't require specific parameters as it uses the authenticated user context
 */
export class FetchPendingCommandsRequest {
  constructor() {
  }

  /**
   * Creates a FetchPendingCommandsRequest from request payload
   * @param payload - The request payload (can be empty)
   * @returns FetchPendingCommandsRequest instance
   */
  static fromPayload(payload: FetchPendingCommandsRequestPayload): FetchPendingCommandsRequest {
    return new FetchPendingCommandsRequest();
  }
}
