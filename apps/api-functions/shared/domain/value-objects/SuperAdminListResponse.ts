/**
 * @fileoverview SuperAdminListResponse - Domain value object for Super Admin list responses
 * @description Represents a list of Super Admin profiles
 */

import { SuperAdminProfile } from '../entities/SuperAdminProfile';

/**
 * Interface for the raw Super Admin list response payload.
 */
export interface SuperAdminListResponsePayload {
  superAdmins: Array<{
    id: string;
    userId: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  }>;
  totalCount: number;
}

/**
 * Value object representing a list of Super Admin profiles.
 */
export class SuperAdminListResponse {
  constructor(
    public readonly superAdmins: SuperAdminProfile[],
    public readonly totalCount: number
  ) {}

  /**
   * Creates a SuperAdminListResponse from an array of SuperAdminProfile entities.
   * @param profiles - Array of SuperAdminProfile entities
   * @returns A new SuperAdminListResponse instance
   */
  static fromProfiles(profiles: SuperAdminProfile[]): SuperAdminListResponse {
    return new SuperAdminListResponse(profiles, profiles.length);
  }

  /**
   * Converts the SuperAdminListResponse entity to a plain object payload suitable for API responses.
   * @returns A plain object representing the list of Super Admins.
   */
  toPayload(): SuperAdminListResponsePayload {
    return {
      superAdmins: this.superAdmins.map(profile => ({
        id: profile.id,
        userId: profile.userId,
        email: profile.user?.email || '',
        fullName: profile.user?.fullName || '',
        role: profile.user?.role || 'SuperAdmin',
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      })),
      totalCount: this.totalCount,
    };
  }
}
