/**
 * @fileoverview GetSupervisorByIdentifierApplicationService - Application service for supervisor lookup operations
 * @summary Orchestrates supervisor lookup operations
 * @description Handles orchestration of domain services for supervisor lookup
 */

import { GetSupervisorByIdentifierRequest } from "../../domain/value-objects/GetSupervisorByIdentifierRequest";
import { GetSupervisorByIdentifierResponse } from "../../domain/value-objects/GetSupervisorByIdentifierResponse";
import { GetSupervisorByIdentifierDomainService } from "../../domain/services/GetSupervisorByIdentifierDomainService";
import { AuthorizationService } from "../../domain/services/AuthorizationService";

/**
 * Application service for handling supervisor lookup operations
 * @description Orchestrates domain services for supervisor lookup
 */
export class GetSupervisorByIdentifierApplicationService {
  /**
   * Creates a new GetSupervisorByIdentifierApplicationService instance
   * @param getSupervisorByIdentifierDomainService - Domain service for supervisor lookup business logic
   * @param authorizationService - Service for authorization operations
   */
  constructor(
    private readonly getSupervisorByIdentifierDomainService: GetSupervisorByIdentifierDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Gets a supervisor by identifier
   * @param callerId - The ID of the caller making the request
   * @param request - The supervisor lookup request
   * @returns Promise that resolves to the supervisor lookup response
   * @throws Error when supervisor lookup fails
   * @example
   * const response = await getSupervisorByIdentifierApplicationService.getSupervisorByIdentifier(callerId, request);
   */
  async getSupervisorByIdentifier(callerId: string, request: GetSupervisorByIdentifierRequest): Promise<GetSupervisorByIdentifierResponse> {
    // Authorization: All authenticated users can look up supervisors
    await this.authorizationService.authorizeUserQuery(callerId);
    
    return await this.getSupervisorByIdentifierDomainService.getSupervisorByIdentifier(request);
  }
}
