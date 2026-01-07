/**
 * @fileoverview UserQueryApplicationService - Application service for user queries
 * @description Orchestrates user query operations with authorization and validation
 */

import { UserQueryRequest } from '../../index';
import { UserQueryResult } from '../../index';
import { IUserRepository } from '../../index';
import { IAuthorizationService } from '../../index';
import { IUserQueryService } from '../../index';
import { ValidationError } from '../../index';
import { ValidationErrorCode } from '../../index';

/**
 * Application service for user query operations
 */
export class UserQueryApplicationService {
  constructor(
    private userRepository: IUserRepository,
    private authorizationService: IAuthorizationService,
    private userQueryService: IUserQueryService
  ) {}

  /**
   * Gets users by role with authorization and validation
   * @param request - User query request
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to user query result
   * @throws ValidationError if request is invalid
   * @throws AuthError if caller is not authorized
   */
  async getUsersByRole(request: UserQueryRequest, callerId: string): Promise<UserQueryResult> {
    // 1. Authorize caller
    await this.authorizationService.authorizeUserQuery(callerId);

    // 2. Validate request
    this.validateUserQueryRequest(request);

    // 3. Execute query
    return await this.userQueryService.findUsersByRoles(request);
  }

  /**
   * Validates user query request
   * @param request - User query request
   * @throws ValidationError if request is invalid
   */
  private validateUserQueryRequest(request: UserQueryRequest): void {
    if (request.roles.length === 0) {
      throw new ValidationError('At least one role must be specified', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
    }
  }
}
