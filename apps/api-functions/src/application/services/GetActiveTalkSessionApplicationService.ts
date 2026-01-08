/**
 * @fileoverview GetActiveTalkSessionApplicationService - Application service for get active talk session operations
 * @summary Orchestrates get active talk session operations
 * @description Handles orchestration of domain services for get active talk session operations
 */

import { GetActiveTalkSessionRequest } from '../../domain/value-objects/GetActiveTalkSessionRequest';
import { GetActiveTalkSessionResponse } from '../../domain/value-objects/GetActiveTalkSessionResponse';
import { GetActiveTalkSessionDomainService } from '../../domain/services/GetActiveTalkSessionDomainService';

/**
 * Application service for handling get active talk session operations
 * @description Orchestrates domain services for get active talk session
 */
export class GetActiveTalkSessionApplicationService {
  /**
   * Creates a new GetActiveTalkSessionApplicationService instance
   * @param getActiveTalkSessionDomainService - Domain service for get active talk session business logic
   */
  constructor(
    private readonly getActiveTalkSessionDomainService: GetActiveTalkSessionDomainService
  ) {}

  /**
   * Gets active talk session information for a PSO
   * @param callerId - The Azure AD Object ID of the caller
   * @param request - The get active talk session request
   * @returns Promise that resolves to the get active talk session response
   */
  async getActiveTalkSession(callerId: string, request: GetActiveTalkSessionRequest): Promise<GetActiveTalkSessionResponse> {
    return await this.getActiveTalkSessionDomainService.getActiveTalkSession(request);
  }
}

