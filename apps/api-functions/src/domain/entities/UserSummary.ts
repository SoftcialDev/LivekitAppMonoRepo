/**
 * @fileoverview UserSummary - Entity for user summary information
 * @description Represents a summary of user information for queries
 */

import { UserRole } from '@prisma/client';

export interface UserSummaryData {
  azureAdObjectId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

/**
 * Entity representing a user summary
 */
export class UserSummary {
  public readonly azureAdObjectId: string;
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly role: UserRole | null;
  public readonly supervisorAdId?: string;
  public readonly supervisorName?: string;

  constructor(data: UserSummaryData) {
    this.azureAdObjectId = data.azureAdObjectId;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role;
    this.supervisorAdId = data.supervisorAdId;
    this.supervisorName = data.supervisorName;
  }

  /**
   * Creates UserSummary from Prisma user data
   * @param user - Prisma user object
   * @returns UserSummary instance
   */
  static fromPrismaUser(user: {
    azureAdObjectId: string;
    email: string;
    fullName: string | null;
    role: string;
    supervisor?: { azureAdObjectId: string; fullName: string | null } | null;
  }): UserSummary {
    const { firstName, lastName } = this.splitName(user.fullName ?? '');
    return new UserSummary({
      azureAdObjectId: user.azureAdObjectId,
      email: user.email,
      firstName,
      lastName,
      role: user.role as UserRole | null,
      supervisorAdId: user.supervisor?.azureAdObjectId ?? undefined,
      supervisorName: user.supervisor?.fullName ?? undefined,
    });
  }

  /**
   * Splits a full name into first and last name
   * @param fullName - Full name string
   * @returns Object with firstName and lastName
   */
  private static splitName(fullName: string): { firstName: string; lastName: string } {
    const [firstName = "", lastName = ""] = (fullName || "").trim().split(/\s+/);
    return { firstName, lastName };
  }
}
