/**
 * @fileoverview GetSupervisorForPsoDomainService - Domain service for supervisor lookup operations
 * @summary Handles supervisor lookup business logic
 * @description Contains the core business logic for finding supervisor by PSO identifier
 */

import { GetSupervisorForPsoRequest } from "../value-objects/GetSupervisorForPsoRequest";
import { GetSupervisorForPsoResponse } from "../value-objects/GetSupervisorForPsoResponse";
import { ISupervisorRepository } from "../interfaces/ISupervisorRepository";

/**
 * Domain service for supervisor lookup business logic
 * @description Handles the core business rules for supervisor lookup operations
 */
export class GetSupervisorForPsoDomainService {
  /**
   * Creates a new GetSupervisorForPsoDomainService instance
   * @param supervisorRepository - Repository for supervisor data access
   */
  constructor(
    private readonly supervisorRepository: ISupervisorRepository
  ) {}

  /**
   * Gets supervisor by PSO identifier
   * @param request - The supervisor lookup request
   * @returns Promise that resolves to the supervisor lookup response
   * @example
   * const response = await getSupervisorForPsoDomainService.getSupervisorForPso(request);
   */
  async getSupervisorForPso(request: GetSupervisorForPsoRequest): Promise<GetSupervisorForPsoResponse> {
    try {
      console.log(`[GetSupervisorForPsoDomainService] Looking for supervisor for PSO identifier: ${request.identifier}`);
      
      // First, find the PSO by identifier
      const pso = await this.supervisorRepository.findPsoByIdentifier(request.identifier);
      console.log(`[GetSupervisorForPsoDomainService] PSO found:`, pso ? { 
        id: pso.id, 
        email: pso.email, 
        role: pso.role, 
        supervisorId: pso.supervisorId 
      } : null);
      
      if (!pso) {
        console.log(`[GetSupervisorForPsoDomainService] PSO not found`);
        return GetSupervisorForPsoResponse.withError("PSO not found");
      }
      
      if (!pso.supervisorId) {
        console.log(`[GetSupervisorForPsoDomainService] PSO has no supervisor assigned`);
        return GetSupervisorForPsoResponse.withMessage("No supervisor assigned");
      }
      
      // Now find the supervisor by supervisorId
      const supervisor = await this.supervisorRepository.findById(pso.supervisorId);
      console.log(`[GetSupervisorForPsoDomainService] Supervisor found:`, supervisor ? {
        id: supervisor.id,
        email: supervisor.email,
        fullName: supervisor.fullName,
        role: supervisor.role
      } : null);
      
      if (!supervisor) {
        console.log(`[GetSupervisorForPsoDomainService] Supervisor not found for ID: ${pso.supervisorId}`);
        return GetSupervisorForPsoResponse.withError("Supervisor not found");
      }
      
      if (!supervisor.isSupervisor()) {
        console.log(`[GetSupervisorForPsoDomainService] User found but is not a supervisor`);
        return GetSupervisorForPsoResponse.withError("User found but is not a supervisor");
      }

      return GetSupervisorForPsoResponse.withSupervisor({
        id: supervisor.id,
        azureAdObjectId: supervisor.azureAdObjectId,
        email: supervisor.email,
        fullName: supervisor.fullName,
      });
    } catch (error: any) {
      console.error(`[GetSupervisorForPsoDomainService] Failed to get supervisor for PSO ${request.identifier}:`, error);
      throw new Error(`Failed to get supervisor: ${error.message}`);
    }
  }
}
