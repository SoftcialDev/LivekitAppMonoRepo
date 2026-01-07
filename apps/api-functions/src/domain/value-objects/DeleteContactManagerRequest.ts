/**
 * @fileoverview DeleteContactManagerRequest - Domain value object for Contact Manager deletion requests
 * @description Represents a request to delete a Contact Manager profile
 */

/**
 * Interface for the raw Contact Manager deletion request payload.
 */
export interface DeleteContactManagerRequestPayload {
  profileId: string;
}

/**
 * Value object representing a Contact Manager deletion request.
 */
export class DeleteContactManagerRequest {
  constructor(
    public readonly profileId: string
  ) {}

  /**
   * Creates a DeleteContactManagerRequest from a raw request payload.
   * @param payload - The raw request payload
   * @returns A new DeleteContactManagerRequest instance
   */
  static fromPayload(payload: DeleteContactManagerRequestPayload): DeleteContactManagerRequest {
    return new DeleteContactManagerRequest(payload.profileId);
  }
}
