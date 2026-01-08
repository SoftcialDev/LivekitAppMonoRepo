/**
 * @fileoverview GetPsosBySupervisorApplicationService - Application service for PSOs lookup operations
 * @summary Orchestrates PSOs lookup operations
 * @description Handles orchestration of domain services for PSOs lookup
 */

import { GetPsosBySupervisorRequest } from '../../domain/value-objects/GetPsosBySupervisorRequest';
import { GetPsosBySupervisorResponse } from '../../domain/value-objects/GetPsosBySupervisorResponse';
import { GetPsosBySupervisorDomainService } from '../../domain/services/GetPsosBySupervisorDomainService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { UserRole } from '@prisma/client';
import { UserNotFoundError } from '../../domain/errors/UserErrors';
import { InsufficientPrivilegesError } from '../../domain/errors/MiddlewareErrors';

/**
 * Application service for handling PSOs lookup operations
 * @description Orchestrates domain services for PSOs lookup
 */
export class GetPsosBySupervisorApplicationService {
  /**
   * Creates a new GetPsosBySupervisorApplicationService instance
   * @param getPsosBySupervisorDomainService - Domain service for PSOs lookup business logic
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly getPsosBySupervisorDomainService: GetPsosBySupervisorDomainService,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Gets PSOs by supervisor
   * @param callerId - The ID of the caller making the request
   * @param request - The PSOs lookup request
   * @returns Promise that resolves to the PSOs lookup response
   * @throws Error when PSOs lookup fails
   * @example
   * const response = await getPsosBySupervisorApplicationService.getPsosBySupervisor(callerId, request);
   */
  async getPsosBySupervisor(callerId: string, request: GetPsosBySupervisorRequest): Promise<GetPsosBySupervisorResponse> {
    // 1. Get caller information for authorization
    const caller = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!caller) {
      throw new UserNotFoundError("Caller not found");
    }

    // 2. Authorization logic based on caller role
    if (caller.role === UserRole.Supervisor) {
      // Supervisors can query PSOs of any supervisor, but if no supervisorId is provided,
      // or if supervisorId matches their own ID, they get their own PSOs
      if (!request.supervisorId || request.supervisorId === caller.id || request.supervisorId === caller.azureAdObjectId) {
        // Force to caller's own PSOs
        const supervisorRequest = new GetPsosBySupervisorRequest(callerId, caller.id);
        return await this.getPsosBySupervisorDomainService.getPsosBySupervisor(supervisorRequest);
      } else {
        // Query PSOs of other supervisors
        return await this.getPsosBySupervisorDomainService.getPsosBySupervisor(request);
      }
    } else if (caller.role === UserRole.Admin || caller.role === UserRole.SuperAdmin) {
      // Admins and SuperAdmins can see all PSOs or filter by specific supervisor
      return await this.getPsosBySupervisorDomainService.getPsosBySupervisor(request);
    } else {
      throw new InsufficientPrivilegesError("Insufficient privileges to access PSOs");
    }
  }
}
