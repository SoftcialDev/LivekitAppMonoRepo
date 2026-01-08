/**
 * @fileoverview GetUserDebugApplicationService - Application service for user debug operations
 * @summary Orchestrates getting comprehensive user debug information
 * @description Coordinates domain services to retrieve complete user information
 * including roles, permissions, Contact Manager profile, and supervisor information
 */

import { GetUserDebugRequest } from '../../domain/value-objects/GetUserDebugRequest';
import { GetUserDebugResponse } from '../../domain/value-objects/GetUserDebugResponse';
import { GetUserDebugDomainService } from '../../domain/services/GetUserDebugDomainService';

/**
 * Application service for user debug operations
 */
export class GetUserDebugApplicationService {
  constructor(
    private readonly getUserDebugDomainService: GetUserDebugDomainService
  ) {}

  /**
   * Gets comprehensive user debug information
   * @param request - Get user debug request
   * @returns Promise that resolves to GetUserDebugResponse
   */
  async getUserDebug(request: GetUserDebugRequest): Promise<GetUserDebugResponse> {
    return await this.getUserDebugDomainService.getUserDebug(request);
  }
}

