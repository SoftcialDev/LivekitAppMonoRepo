/**
 * @fileoverview ContactManagerStatusResponse - Domain value object for Contact Manager status response
 * @description Represents a response containing Contact Manager status information
 */

/**
 * Interface for Contact Manager status response data.
 */
export interface ContactManagerStatusData {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Value object representing a Contact Manager status response.
 */
export class ContactManagerStatusResponse {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly status: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  /**
   * Creates a ContactManagerStatusResponse from ContactManagerProfile entity.
   * @param profile - ContactManagerProfile entity
   * @returns A new ContactManagerStatusResponse instance
   */
  static fromProfile(profile: any): ContactManagerStatusResponse {
    return new ContactManagerStatusResponse(
      profile.id,
      profile.userId,
      profile.user?.email || '',
      profile.user?.fullName || '',
      profile.status,
      profile.createdAt.toISOString(),
      profile.updatedAt.toISOString()
    );
  }

  /**
   * Converts the response to a payload suitable for API responses.
   * @returns Object containing the status data
   */
  toPayload(): ContactManagerStatusData {
    return {
      id: this.id,
      userId: this.userId,
      email: this.email,
      fullName: this.fullName,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
