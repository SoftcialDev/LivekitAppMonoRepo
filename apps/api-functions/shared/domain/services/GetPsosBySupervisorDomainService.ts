/**
 * @fileoverview GetPsosBySupervisorDomainService - Domain service for PSOs lookup operations
 * @summary Handles PSOs lookup business logic
 * @description Contains the core business logic for finding PSOs by supervisor
 */

import { GetPsosBySupervisorRequest } from "../value-objects/GetPsosBySupervisorRequest";
import { GetPsosBySupervisorResponse } from "../value-objects/GetPsosBySupervisorResponse";
import { IUserRepository } from "../interfaces/IUserRepository";

/**
 * Domain service for PSOs lookup business logic
 * @description Handles the core business rules for PSOs lookup operations
 */
export class GetPsosBySupervisorDomainService {
  /**
   * Creates a new GetPsosBySupervisorDomainService instance
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Gets PSOs by supervisor
   * @param request - The PSOs lookup request
   * @returns Promise that resolves to the PSOs lookup response
   * @example
   * const response = await getPsosBySupervisorDomainService.getPsosBySupervisor(request);
   */
  async getPsosBySupervisor(request: GetPsosBySupervisorRequest): Promise<GetPsosBySupervisorResponse> {
    try {
      const psos = await this.userRepository.getPsosBySupervisor(request.supervisorId);
      return GetPsosBySupervisorResponse.withPsos(psos);
    } catch (error: any) {
      console.error(`Failed to get PSOs by supervisor for caller ${request.callerId}:`, error);
      throw new Error(`Failed to get PSOs: ${error.message}`);
    }
  }
}
