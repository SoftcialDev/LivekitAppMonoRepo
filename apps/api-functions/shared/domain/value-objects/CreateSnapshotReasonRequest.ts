/**
 * @fileoverview CreateSnapshotReasonRequest.ts - Value object for creating snapshot reasons
 * @summary Encapsulates snapshot reason creation request data
 * @description Value object representing a request to create a new snapshot reason
 */

import { CreateSnapshotReasonParams } from '../schemas/CreateSnapshotReasonSchema';

/**
 * Value object representing a request to create a snapshot reason.
 */
export class CreateSnapshotReasonRequest {
  /**
   * Creates a new CreateSnapshotReasonRequest instance.
   * @param label - The human-readable label for the reason
   * @param code - The unique code for the reason
   * @param order - Display order for the reason
   */
  constructor(
    public readonly label: string,
    public readonly code: string,
    public readonly order: number
  ) {}

  /**
   * Creates a CreateSnapshotReasonRequest from validated parameters.
   * @param params - Validated request parameters
   * @returns CreateSnapshotReasonRequest instance
   */
  static fromBody(params: CreateSnapshotReasonParams): CreateSnapshotReasonRequest {
    return new CreateSnapshotReasonRequest(
      params.label,
      params.code,
      params.order
    );
  }
}

