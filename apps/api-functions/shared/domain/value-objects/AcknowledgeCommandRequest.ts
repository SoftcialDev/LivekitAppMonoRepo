/**
 * @fileoverview AcknowledgeCommandRequest - Value object for command acknowledgment requests
 * @description Represents a request to acknowledge multiple pending commands
 */

import { getCentralAmericaTime } from '../../utils/dateUtils';

export interface AcknowledgeCommandRequestPayload {
  ids: string[];
}

/**
 * Value object representing a request to acknowledge pending commands
 */
export class AcknowledgeCommandRequest {
  public readonly commandIds: string[];
  public readonly timestamp: Date;

  constructor(commandIds: string[]) {
    if (!commandIds || commandIds.length === 0) {
      throw new Error('Command IDs array cannot be empty');
    }

    if (!commandIds.every(id => typeof id === 'string' && id.length > 0)) {
      throw new Error('All command IDs must be non-empty strings');
    }

    this.commandIds = [...commandIds]; // Create a copy to ensure immutability
    this.timestamp = getCentralAmericaTime();

    // Freeze the object to prevent runtime modifications
    Object.freeze(this);
  }

  /**
   * Creates an AcknowledgeCommandRequest from request body
   * @param body - Request body containing command IDs
   * @returns AcknowledgeCommandRequest instance
   * @throws Error if validation fails
   */
  static fromBody(body: unknown): AcknowledgeCommandRequest {
    if (!body || typeof body !== 'object') {
      throw new Error('Request body must be an object');
    }

    const payload = body as AcknowledgeCommandRequestPayload;
    
    if (!payload.ids || !Array.isArray(payload.ids)) {
      throw new Error('Request body must contain an array of command IDs');
    }

    return new AcknowledgeCommandRequest(payload.ids);
  }

  /**
   * Converts to payload format for API response
   * @returns Payload representation
   */
  toPayload(): AcknowledgeCommandRequestPayload {
    return {
      ids: [...this.commandIds]
    };
  }
}
