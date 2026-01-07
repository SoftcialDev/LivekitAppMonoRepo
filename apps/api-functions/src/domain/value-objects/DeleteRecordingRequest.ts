/**
 * @fileoverview DeleteRecordingRequest - Value object for delete recording requests
 * @summary Encapsulates delete recording request data
 * @description Represents a request to delete a recording session with validation
 */

import { DeleteRecordingParams } from "../schemas/DeleteRecordingSchema";

/**
 * Value object representing a delete recording request
 * @description Encapsulates the recording ID for deletion operations
 */
export class DeleteRecordingRequest {
  /**
   * Creates a new DeleteRecordingRequest instance
   * @param id - The unique identifier of the recording to delete
   */
  constructor(public readonly id: string) {}

  /**
   * Creates a DeleteRecordingRequest from validated path parameters
   * @param params - Validated path parameters containing the recording ID
   * @returns A new DeleteRecordingRequest instance
   */
  static fromParams(params: DeleteRecordingParams): DeleteRecordingRequest {
    return new DeleteRecordingRequest(params.id);
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { id: string } {
    return {
      id: this.id,
    };
  }
}
