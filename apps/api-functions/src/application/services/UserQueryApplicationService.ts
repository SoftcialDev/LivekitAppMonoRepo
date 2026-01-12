/**
 * @fileoverview UserQueryApplicationService - Application service for user queries
 * @description Orchestrates user query operations with authorization and validation
 */

import { UserQueryRequest } from '../../domain/value-objects/UserQueryRequest';
import { UserQueryResult } from '../../domain/value-objects/UserQueryResult';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IUserQueryService } from '../../domain/interfaces/IUserQueryService';
import { ValidationError } from '../../domain/errors/DomainError';
import { ValidationErrorCode } from '../../domain/errors/ErrorCodes';

/**
 * Application service for user query operations
 */
export class UserQueryApplicationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authorizationService: IAuthorizationService,
    private readonly userQueryService: IUserQueryService
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
