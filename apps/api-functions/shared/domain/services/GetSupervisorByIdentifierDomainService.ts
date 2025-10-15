/**
 * @fileoverview GetSupervisorByIdentifierDomainService - Domain service for supervisor lookup operations
 * @summary Handles supervisor lookup business logic
 * @description Contains the core business logic for finding supervisors by identifier
 */

import { GetSupervisorByIdentifierRequest } from "../value-objects/GetSupervisorByIdentifierRequest";
import { GetSupervisorByIdentifierResponse } from "../value-objects/GetSupervisorByIdentifierResponse";
import { ISupervisorRepository } from "../interfaces/ISupervisorRepository";

/**
 * Domain service for supervisor lookup business logic
 * @description Handles the core business rules for supervisor lookup operations
 */
export class GetSupervisorByIdentifierDomainService {
  /**
   * Creates a new GetSupervisorByIdentifierDomainService instance
   * @param supervisorRepository - Repository for supervisor data access
   */
  constructor(
    private readonly supervisorRepository: ISupervisorRepository
  ) {}

  /**
   * Finds a supervisor by identifier
   * @param request - The supervisor lookup request
   * @returns Promise that resolves to the supervisor lookup response
   * @example
   * const response = await getSupervisorByIdentifierDomainService.getSupervisorByIdentifier(request);
   */
  async getSupervisorByIdentifier(request: GetSupervisorByIdentifierRequest): Promise<GetSupervisorByIdentifierResponse> {
    try {
      const result = await this.supervisorRepository.findSupervisorByIdentifier(request.identifier);

      if (typeof result === "string") {
        // Handle error cases
        if (result === "No supervisor assigned") {
          return GetSupervisorByIdentifierResponse.withMessage("No supervisor assigned");
        }
        if (result === "User found but is not a supervisor") {
          return GetSupervisorByIdentifierResponse.withMessage("User found but is not a supervisor");
        }
        if (result === "User not found") {
          return GetSupervisorByIdentifierResponse.withMessage("User not found");
        }
        // Generic error message
        return GetSupervisorByIdentifierResponse.withMessage(result);
      }

      // Supervisor found - return supervisor data
      return GetSupervisorByIdentifierResponse.withSupervisor({
        id: result.id,
        azureAdObjectId: result.azureAdObjectId,
        email: result.email,
        fullName: result.fullName
      });
    } catch (error: any) {
      console.error(`Failed to get supervisor by identifier ${request.identifier}:`, error);
      return GetSupervisorByIdentifierResponse.withMessage(`Failed to find supervisor: ${error.message}`);
    }
  }
}
