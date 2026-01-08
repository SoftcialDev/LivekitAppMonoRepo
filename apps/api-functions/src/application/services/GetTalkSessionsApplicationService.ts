/**
 * @fileoverview GetTalkSessionsApplicationService.ts - Application service for talk sessions query operations
 * @summary Handles talk sessions query application logic
 * @description Orchestrates talk sessions query operations with authorization
 */

import { GetTalkSessionsDomainService } from '../../domain/services/GetTalkSessionsDomainService';
import { GetTalkSessionsRequest } from '../../domain/value-objects/GetTalkSessionsRequest';
import { GetTalkSessionsResponse } from '../../domain/value-objects/GetTalkSessionsResponse';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '../../domain/enums/UserRole';

/**
 * Application service for talk sessions query operations.
 * @description Orchestrates talk sessions queries with authorization checks.
 */
export class GetTalkSessionsApplicationService {
  /**
   * Creates a new GetTalkSessionsApplicationService instance.
   * @param getTalkSessionsDomainService - Domain service for talk sessions queries
   * @param authorizationService - Service for authorization checks
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly getTalkSessionsDomainService: GetTalkSessionsDomainService,
    private readonly authorizationService: AuthorizationService,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Retrieves all talk sessions with pagination.
   * Only Admin and SuperAdmin roles are authorized to access this endpoint.
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param request - The talk sessions query request
   * @returns Promise that resolves to the talk sessions response
   * @throws AuthError if caller is not authorized
   */
  async getTalkSessions(
    callerId: string,
    request: GetTalkSessionsRequest
  ): Promise<GetTalkSessionsResponse> {
    await this.authorizationService.authorizeUserWithRoles(
      callerId,
      [UserRole.Admin, UserRole.SuperAdmin],
      'viewing talk session reports'
    );

    return await this.getTalkSessionsDomainService.getTalkSessions(request);
  }
}

