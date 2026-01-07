/**
 * @fileoverview UpdateContactManagerStatusRequest - Domain value object for Contact Manager status update requests
 * @description Represents a request to update a Contact Manager's status
 */

import { ContactManagerStatus } from '@prisma/client';

/**
 * Interface for the raw Contact Manager status update request payload.
 */
export interface UpdateContactManagerStatusRequestPayload {
  status: string;
}

/**
 * Value object representing a Contact Manager status update request.
 */
export class UpdateContactManagerStatusRequest {
  constructor(
    public readonly status: ContactManagerStatus
  ) {}

  /**
   * Creates an UpdateContactManagerStatusRequest from a raw request body.
   * @param body - The raw request body
   * @returns A new UpdateContactManagerStatusRequest instance
   */
  static fromBody(body: UpdateContactManagerStatusRequestPayload): UpdateContactManagerStatusRequest {
    return new UpdateContactManagerStatusRequest(body.status as ContactManagerStatus);
  }
}
