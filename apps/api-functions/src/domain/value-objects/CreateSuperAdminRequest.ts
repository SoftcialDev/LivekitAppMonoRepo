/**
 * @fileoverview CreateSuperAdminRequest - Domain value object for Super Admin creation requests
 * @description Represents a request to create a new Super Admin
 */

/**
 * Interface for the raw Super Admin creation request payload.
 */
export interface CreateSuperAdminRequestPayload {
  email: string;
}

/**
 * Value object representing a Super Admin creation request.
 */
export class CreateSuperAdminRequest {
  constructor(
    public readonly email: string
  ) {}

  /**
   * Creates a CreateSuperAdminRequest from a raw request body.
   * @param body - The raw request body
   * @returns A new CreateSuperAdminRequest instance
   */
  static fromBody(body: CreateSuperAdminRequestPayload): CreateSuperAdminRequest {
    return new CreateSuperAdminRequest(body.email.toLowerCase());
  }
}
