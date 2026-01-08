/**
 * @fileoverview CommandAcknowledgmentApplicationService - Application service for command acknowledgment
 * @description Orchestrates command acknowledgment operations with authorization
 */

import { ICommandAcknowledgmentService } from '../../domain/interfaces';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { AcknowledgeCommandRequest } from '../../domain/value-objects/AcknowledgeCommandRequest';
import { AcknowledgeCommandResult } from '../../domain/value-objects/AcknowledgeCommandResult';

/**
 * Application service for command acknowledgment operations
 */
export class CommandAcknowledgmentApplicationService {
  constructor(
    private commandAcknowledgmentService: ICommandAcknowledgmentService,
    private authorizationService: IAuthorizationService
  ) {}

  /**
   * Acknowledges multiple pending commands for a PSO
   * @param request - Command acknowledgment request
   * @param callerId - ID of the user making the request
   * @returns Promise that resolves to acknowledgment result
   * @throws Error if business rules fail
   */
  async acknowledgeCommands(
    request: AcknowledgeCommandRequest,
    callerId: string
  ): Promise<AcknowledgeCommandResult> {
    // Permission check is done at middleware level
    return await this.commandAcknowledgmentService.acknowledgeCommands(request, callerId);
  }
}
