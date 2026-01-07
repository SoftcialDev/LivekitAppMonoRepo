/**
 * @fileoverview CreateContactManagerRequest - Domain value object for contact manager creation requests
 * @description Represents a request to create a new contact manager
 */

import { ContactManagerStatus } from '@prisma/client';

/**
 * Interface for the raw contact manager creation request payload.
 */
export interface CreateContactManagerRequestPayload {
  email: string;
  status: ContactManagerStatus;
}

/**
 * Value object representing a contact manager creation request.
 */
export class CreateContactManagerRequest {
  constructor(
    public readonly email: string,
    public readonly status: ContactManagerStatus
  ) {}

  /**
   * Creates a CreateContactManagerRequest from a raw request body.
   * @param body - The raw request body
   * @returns A new CreateContactManagerRequest instance
   */
  static fromBody(body: CreateContactManagerRequestPayload): CreateContactManagerRequest {
    return new CreateContactManagerRequest(body.email, body.status);
  }
}
