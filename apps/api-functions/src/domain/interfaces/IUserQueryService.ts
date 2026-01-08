/**
 * @fileoverview IUserQueryService - Domain interface for user query service
 * @summary Defines the contract for user query operations
 * @description Provides the interface for user query business logic operations
 */

import { UserQueryRequest } from '../value-objects/UserQueryRequest';
import { UserQueryResult } from '../value-objects/UserQueryResult';

/**
 * Interface for user query service operations
 * Defines the contract for business logic related to user queries
 */
export interface IUserQueryService {
  /**
   * Finds users by roles with pagination
   * @param request - User query request
   * @returns Promise that resolves to the response with user query result
   */
  findUsersByRoles(request: UserQueryRequest): Promise<UserQueryResult>;
}

