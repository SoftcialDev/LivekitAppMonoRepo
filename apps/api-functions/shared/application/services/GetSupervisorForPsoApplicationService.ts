/**
 * @fileoverview GetSupervisorForPsoApplicationService - Application service for supervisor lookup operations
 * @summary Orchestrates supervisor lookup operations
 * @description Handles orchestration of domain services for supervisor lookup
 */

import { GetSupervisorForPsoRequest } from "../../domain/value-objects/GetSupervisorForPsoRequest";
import { GetSupervisorForPsoResponse } from "../../domain/value-objects/GetSupervisorForPsoResponse";
import { GetSupervisorForPsoDomainService } from "../../domain/services/GetSupervisorForPsoDomainService";
import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { UserRole } from "@prisma/client";

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
      throw new Error("Caller not found");
    }

    // 2. Authorization: Only Admins, SuperAdmins, and Supervisors can query supervisor information
    if (caller.role !== UserRole.Admin && caller.role !== UserRole.SuperAdmin && caller.role !== UserRole.Supervisor) {
      throw new Error("Insufficient privileges to access supervisor information");
    }

    // 3. Additional authorization for Supervisors: they can only query their own PSOs
    if (caller.role === UserRole.Supervisor) {
      // Check if the identifier belongs to one of the supervisor's PSOs
      const pso = await this.userRepository.findByAzureAdObjectId(request.identifier) || 
                  await this.userRepository.findByEmail(request.identifier) ||
                  await this.userRepository.findById(request.identifier);
      
      if (!pso || pso.supervisorId !== caller.id) {
        throw new Error("Supervisors can only query supervisor information for their assigned PSOs");
      }
    }

    return await this.getSupervisorForPsoDomainService.getSupervisorForPso(request);
  }
}
