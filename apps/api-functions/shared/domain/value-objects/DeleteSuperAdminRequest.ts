/**
 * @fileoverview DeleteSuperAdminRequest - Domain value object for Super Admin deletion requests
 * @description Represents a request to remove Super Admin role from a user
 */

/**
 * Interface for the raw Super Admin deletion request payload.
 */
export interface DeleteSuperAdminRequestPayload {
  userId: string;
}

/**
 * Value object representing a Super Admin deletion request.
 */
export class DeleteSuperAdminRequest {
  constructor(
    public readonly userId: string
  ) {}

  /**
   * Creates a DeleteSuperAdminRequest from a raw request payload.
   * @param payload - The raw request payload
   * @returns A new DeleteSuperAdminRequest instance
   */
  static fromPayload(payload: DeleteSuperAdminRequestPayload): DeleteSuperAdminRequest {
    return new DeleteSuperAdminRequest(payload.userId);
  }
}
