/**
 * @fileoverview UserQueryRequest - Value object for user query requests
 * @description Represents a request to query users by roles with pagination
 */

import { UserRole } from '@prisma/client';
import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';
import { getCentralAmericaTime } from '../../utils/dateUtils';

export interface UserQueryRequestPayload {
  roles: string[];
  page: number;
  pageSize: number;
}

/**
 * Value object representing a user query request
 */
export class UserQueryRequest {
  public readonly roles: (UserRole | null)[];
  public readonly page: number;
  public readonly pageSize: number;
  public readonly timestamp: Date;

  constructor(roles: (UserRole | null)[], page: number, pageSize: number) {
    this.roles = roles;
    this.page = Math.max(1, page);
    this.pageSize = Math.max(1, Math.min(1000, pageSize));
    this.timestamp = getCentralAmericaTime();
    Object.freeze(this);
  }

  /**
   * Creates a UserQueryRequest from query string parameters
   * @param query - Query string parameters
   * @returns UserQueryRequest instance
   * @throws ValidationError if parameters are invalid
   */
  static fromQueryString(query: any): UserQueryRequest {
    const rawRoleParam = (query.role as string || "").trim();
    
    if (!rawRoleParam) {
      throw new ValidationError('Role parameter is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
    }

    const requestedRoles = rawRoleParam.split(",").map(r => r.trim());
    const roles: (UserRole | null)[] = [];

    for (const role of requestedRoles) {
      if (role === 'null' || role === '' || role === 'Unassigned') {
        roles.push(null); // Map both 'null' and 'Unassigned' to null for backward compatibility
      } else if (Object.values(UserRole).includes(role as UserRole)) {
        roles.push(role as UserRole);
      } else {
        throw new ValidationError(`Invalid role: ${role}`, ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
      }
    }

    return new UserQueryRequest(
      roles,
      parseInt(query.page) || 1,
      parseInt(query.pageSize) || 50
    );
  }

  /**
   * Checks if the request includes null role
   * @returns True if null role is requested
   */
  hasNullRole(): boolean {
    return this.roles.includes(null);
  }

  /**
   * Gets the Prisma roles (excluding null)
   * @returns Array of UserRole values
   */
  getPrismaRoles(): UserRole[] {
    return this.roles.filter(role => role !== null) as UserRole[];
  }

  /**
   * Converts to payload format
   * @returns Payload representation
   */
  toPayload(): UserQueryRequestPayload {
    return {
      roles: this.roles.map(role => role || 'null'),
      page: this.page,
      pageSize: this.pageSize,
    };
  }
}
