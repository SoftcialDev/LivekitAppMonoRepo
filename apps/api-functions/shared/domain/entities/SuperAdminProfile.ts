/**
 * @fileoverview SuperAdminProfile - Domain entity for Super Admin profiles
 * @summary Represents a Super Admin profile in the domain
 * @description Encapsulates Super Admin profile data and business logic
 */

/**
 * Domain entity representing a Super Admin profile.
 */
export class SuperAdminProfile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly user?: {
      email: string;
      fullName: string;
      role?: string;
    }
  ) {}

  /**
   * Creates a SuperAdminProfile from Prisma data.
   * @param data - Prisma SuperAdminProfile data
   * @returns A new SuperAdminProfile instance
   */
  static fromPrisma(data: {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }): SuperAdminProfile {
    return new SuperAdminProfile(
      data.id,
      data.userId,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Converts the entity to a payload suitable for API responses.
   * @returns Object containing the profile data
   */
  toPayload(): { 
    id: string; 
    userId: string; 
    createdAt: string; 
    updatedAt: string;
    user?: {
      email: string;
      fullName: string;
      role?: string;
    };
  } {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      ...(this.user && { user: this.user })
    };
  }
}
