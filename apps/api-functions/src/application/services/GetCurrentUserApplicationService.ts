/**
 * @fileoverview GetCurrentUserApplicationService - Application service for current user operations
 * @description Orchestrates getting current user information with auto-provisioning
 */

import { JwtPayload } from 'jsonwebtoken';
import { GetCurrentUserRequest } from '../../domain/value-objects/GetCurrentUserRequest';
import { GetCurrentUserResponse } from '../../domain/value-objects/GetCurrentUserResponse';
import { GetCurrentUserDomainService } from '../../domain/services/GetCurrentUserDomainService';

/**
 * Application service for current user operations
 */
export class GetCurrentUserApplicationService {
  constructor(
    private readonly getCurrentUserDomainService: GetCurrentUserDomainService
  ) {}

  /**
   * Gets current authenticated user information
   * Creates user automatically with PSO role if they don't exist
   * @param request - Get current user request
   * @param jwtPayload - JWT token payload from Azure AD
   * @returns Promise that resolves to GetCurrentUserResponse
   * @throws Error if email is not found in JWT token
   */
  async getCurrentUser(
    request: GetCurrentUserRequest,
    jwtPayload: JwtPayload
  ): Promise<GetCurrentUserResponse> {
    // No authorization needed - all authenticated users can get their own info
    // Delegate to domain service for business logic
    return await this.getCurrentUserDomainService.getCurrentUser(request, jwtPayload);
  }
}

