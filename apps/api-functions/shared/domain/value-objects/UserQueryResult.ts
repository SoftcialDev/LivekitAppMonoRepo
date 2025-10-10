/**
 * @fileoverview UserQueryResult - Value object for user query results
 * @description Represents the result of a user query with pagination
 */

import { UserSummary } from '../entities/UserSummary';
import { getCentralAmericaTime } from '../../utils/dateUtils';

export interface UserQueryResultPayload {
  total: number;
  page: number;
  pageSize: number;
  users: UserSummary[];
}

/**
 * Value object representing the result of a user query
 */
export class UserQueryResult {
  public readonly total: number;
  public readonly page: number;
  public readonly pageSize: number;
  public readonly users: UserSummary[];
  public readonly timestamp: Date;

  constructor(total: number, page: number, pageSize: number, users: UserSummary[]) {
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.users = users;
    this.timestamp = getCentralAmericaTime();
  }

  /**
   * Creates a UserQueryResult instance
   * @param total - Total number of users
   * @param page - Current page number
   * @param pageSize - Number of users per page
   * @param users - Array of user summaries
   * @returns UserQueryResult instance
   */
  static create(total: number, page: number, pageSize: number, users: UserSummary[]): UserQueryResult {
    return new UserQueryResult(total, page, pageSize, users);
  }

  /**
   * Converts to payload format for API response
   * @returns Payload representation
   */
  toPayload(): UserQueryResultPayload {
    return {
      total: this.total,
      page: this.page,
      pageSize: this.pageSize,
      users: this.users,
    };
  }
}
