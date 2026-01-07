/**
 * @fileoverview ICommandAcknowledgmentService - Interface for command acknowledgment operations
 * @description Defines the contract for command acknowledgment domain services
 */

import { AcknowledgeCommandRequest } from '../value-objects/AcknowledgeCommandRequest';
import { AcknowledgeCommandResult } from '../value-objects/AcknowledgeCommandResult';

/**
 * Interface for command acknowledgment domain service
 */
export interface ICommandAcknowledgmentService {
  /**
   * Acknowledges multiple pending commands for an employee
   * @param request - Command acknowledgment request
   * @param callerId - ID of the user making the request
   * @returns Promise that resolves to acknowledgment result
   * @throws Error if validation or business rules fail
   */
  acknowledgeCommands(
    request: AcknowledgeCommandRequest,
    callerId: string
  ): Promise<AcknowledgeCommandResult>;
}
