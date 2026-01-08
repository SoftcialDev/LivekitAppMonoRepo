/**
 * @fileoverview ProcessCommandApplicationService - Application service for process command operations
 * @summary Orchestrates command processing
 * @description Handles orchestration of domain services for process command operations
 */

import { ProcessCommandRequest } from '../../domain/value-objects/ProcessCommandRequest';
import { ProcessCommandResponse } from '../../domain/value-objects/ProcessCommandResponse';
import { ProcessCommandDomainService } from '../../domain/services/ProcessCommandDomainService';

/**
 * Application service for handling process command operations
 * @description Orchestrates domain services for command processing
 */
export class ProcessCommandApplicationService {
  /**
   * Creates a new ProcessCommandApplicationService instance
   * @param processCommandDomainService - Domain service for process command business logic
   */
  constructor(
    private readonly processCommandDomainService: ProcessCommandDomainService
  ) {}

  /**
   * Processes a command from Service Bus
   * @param request - The process command request
   * @returns Promise that resolves to the process command response
   * @throws UserNotFoundError when user is not found
   * @example
   * const response = await processCommandApplicationService.processCommand(request);
   */
  async processCommand(request: ProcessCommandRequest): Promise<ProcessCommandResponse> {
    // Delegate to domain service for business logic
    return await this.processCommandDomainService.processCommand(request);
  }
}
