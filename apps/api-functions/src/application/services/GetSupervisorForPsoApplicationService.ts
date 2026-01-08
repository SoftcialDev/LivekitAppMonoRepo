/**
 * @fileoverview GetSupervisorForPsoApplicationService - Application service for supervisor lookup operations
 * @summary Orchestrates supervisor lookup operations
 * @description Handles orchestration of domain services for supervisor lookup
 */

import { GetSupervisorForPsoRequest } from '../../domain/value-objects/GetSupervisorForPsoRequest';
import { GetSupervisorForPsoResponse } from '../../domain/value-objects/GetSupervisorForPsoResponse';
import { GetSupervisorForPsoDomainService } from '../../domain/services/GetSupervisorForPsoDomainService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { UserRole } from '@prisma/client';
import { UserNotFoundError } from '../../domain/errors/UserErrors';
import { InsufficientPrivilegesError } from '../../domain/errors';

/**
 * Application service for handling supervisor lookup operations
 * @description Orchestrates domain services for supervisor lookup
 */
export class GetSupervisorForPsoApplicationService {
  /**
   * Creates a new GetSupervisorForPsoApplicationService instance
   * @param getSupervisorForPsoDomainService - Domain service for supervisor lookup business logic
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly getSupervisorForPsoDomainService: GetSupervisorForPsoDomainService,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Gets supervisor by PSO identifier
   * @param callerId - The ID of the caller making the request
   * @param request - The supervisor lookup request
   * @returns Promise that resolves to the supervisor lookup response
   * @throws Error when supervisor lookup fails
   * @example
   * const response = await getSupervisorForPsoApplicationService.getSupervisorForPso(callerId, request);
   */
  async getSupervisorForPso(callerId: string, request: GetSupervisorForPsoRequest): Promise<GetSupervisorForPsoResponse> {
    // 1. Get caller information for authorization
    const caller = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!caller) {
      throw new UserNotFoundError("Caller not found");
    }

    // 2. Authorization logic based on caller role
    if (caller.role === UserRole.PSO) {
      // PSOs can only query their own supervisor
      if (request.identifier !== caller.azureAdObjectId && 
          request.identifier !== caller.id && 
          request.identifier !== caller.email) {
        throw new InsufficientPrivilegesError("PSOs can only query their own supervisor information");
      }
    } else if (caller.role === UserRole.Supervisor) {
      // Supervisors can query supervisor information for their assigned PSOs
      const pso = await this.userRepository.findByAzureAdObjectId(request.identifier) || 
                  await this.userRepository.findByEmail(request.identifier) ||
                  await this.userRepository.findById(request.identifier);
      
      if (!pso || pso.supervisorId !== caller.id) {
        throw new InsufficientPrivilegesError("Supervisors can only query supervisor information for their assigned PSOs");
      }
    } else if (caller.role !== UserRole.Admin && caller.role !== UserRole.SuperAdmin) {
      // Only Admins and SuperAdmins can query any supervisor information
      throw new InsufficientPrivilegesError("Insufficient privileges to access supervisor information");
    }

    return await this.getSupervisorForPsoDomainService.getSupervisorForPso(request);
  }
}
