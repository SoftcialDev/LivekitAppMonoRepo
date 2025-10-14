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
      const result = await this.supervisorRepository.findSupervisorByIdentifier(request.identifier);

      if (typeof result === "string") {
        // Handle error cases
        if (result === "No supervisor assigned") {
          return GetSupervisorForPsoResponse.withMessage(result);
        }
        return GetSupervisorForPsoResponse.withError(result);
      }

      // Supervisor found
      return GetSupervisorForPsoResponse.withSupervisor({
        id: result.id,
        azureAdObjectId: result.azureAdObjectId,
        email: result.email,
        fullName: result.fullName,
      });
    } catch (error: any) {
      console.error(`Failed to get supervisor for PSO ${request.identifier}:`, error);
      throw new Error(`Failed to get supervisor: ${error.message}`);
    }
  }
}
