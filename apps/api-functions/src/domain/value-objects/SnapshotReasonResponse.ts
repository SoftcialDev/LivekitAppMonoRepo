/**
 * @fileoverview SnapshotReasonResponse.ts - Value object for snapshot reason responses
 * @summary Encapsulates snapshot reason response data
 * @description Value object representing a snapshot reason in API responses
 */

/**
 * Value object representing a snapshot reason response.
 */
export class SnapshotReasonResponse {
  /**
   * Creates a new SnapshotReasonResponse instance.
   * @param id - The unique identifier of the snapshot reason
   * @param label - The human-readable label for the reason
   * @param code - The unique code for the reason
   * @param isDefault - Whether this is a default reason
   * @param isActive - Whether this reason is currently active
   * @param order - Display order for the reason
   */
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly code: string,
    public readonly isDefault: boolean,
    public readonly isActive: boolean,
    public readonly order: number
  ) {}

  /**
   * Creates a SnapshotReasonResponse from a domain entity.
   * @param reason - Snapshot reason domain entity
   * @returns SnapshotReasonResponse instance
   */
  static fromDomain(reason: {
    id: string;
    label: string;
    code: string;
    isDefault: boolean;
    isActive: boolean;
    order: number;
  }): SnapshotReasonResponse {
    return new SnapshotReasonResponse(
      reason.id,
      reason.label,
      reason.code,
      reason.isDefault,
      reason.isActive,
      reason.order
    );
  }

  /**
   * Converts the response to a plain object.
   * @returns Plain object representation
   */
  toJSON(): {
    id: string;
    label: string;
    code: string;
    isDefault: boolean;
    isActive: boolean;
    order: number;
  } {
    return {
      id: this.id,
      label: this.label,
      code: this.code,
      isDefault: this.isDefault,
      isActive: this.isActive,
      order: this.order
    };
  }
}

