/**
 * @fileoverview ContactManagerListResponse - Domain value object for Contact Manager list responses
 * @description Represents a response containing a list of Contact Managers
 */

import { ContactManagerProfile } from '../entities/ContactManagerProfile';

/**
 * Interface for a single Contact Manager item in the list.
 */
export interface ContactManagerItem {
  id: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Value object representing a Contact Manager list response.
 */
export class ContactManagerListResponse {
  constructor(
    public readonly contactManagers: ContactManagerItem[]
  ) {}

  /**
   * Creates a ContactManagerListResponse from ContactManagerProfile entities.
   * @param profiles - Array of ContactManagerProfile entities
   * @returns A new ContactManagerListResponse instance
   */
  static fromProfiles(profiles: ContactManagerProfile[]): ContactManagerListResponse {
    const contactManagers: ContactManagerItem[] = profiles.map(profile => ({
      id: profile.id,
      email: profile.user?.email || '',
      fullName: profile.user?.fullName || '',
      status: profile.status,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    }));

    return new ContactManagerListResponse(contactManagers);
  }

  /**
   * Converts the response to a payload suitable for API responses.
   * @returns Object containing the contact managers list
   */
  toPayload(): { contactManagers: ContactManagerItem[] } {
    return {
      contactManagers: this.contactManagers
    };
  }
}
