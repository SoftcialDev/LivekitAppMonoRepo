/**
 * @fileoverview GetSupervisorForPsoDomainService - Domain service for supervisor lookup operations
 * @summary Handles supervisor lookup business logic
 * @description Contains the core business logic for finding supervisor by PSO identifier
 */

import { GetSupervisorForPsoRequest } from "../value-objects/GetSupervisorForPsoRequest";
import { GetSupervisorForPsoResponse } from "../value-objects/GetSupervisorForPsoResponse";
import { ISupervisorRepository } from "../interfaces/ISupervisorRepository";
import { ApplicationError } from "../errors/DomainError";
import { ApplicationErrorCode } from "../errors/ErrorCodes";
import { extractErrorMessage } from '../../utils/error/ErrorHelpers';

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
      // First, find the PSO by identifier
      const pso = await this.supervisorRepository.findPsoByIdentifier(request.identifier);
      
      if (!pso) {
        return GetSupervisorForPsoResponse.withError("PSO not found");
      }
      
      if (!pso.supervisorId) {
        return GetSupervisorForPsoResponse.withMessage("No supervisor assigned");
      }
      
      // Now find the supervisor by supervisorId
      const supervisor = await this.supervisorRepository.findById(pso.supervisorId);
      
      if (!supervisor) {
        return GetSupervisorForPsoResponse.withError("Supervisor not found");
      }
      
      if (!supervisor.isSupervisor()) {
        return GetSupervisorForPsoResponse.withError("User found but is not a supervisor");
      }

      return GetSupervisorForPsoResponse.withSupervisor({
        id: supervisor.id,
        azureAdObjectId: supervisor.azureAdObjectId,
        email: supervisor.email,
        fullName: supervisor.fullName,
      });
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new ApplicationError(`Failed to get supervisor: ${errorMessage}`, ApplicationErrorCode.OPERATION_FAILED);
    }
  }
}
