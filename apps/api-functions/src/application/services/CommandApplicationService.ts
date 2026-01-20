/**
 * @fileoverview CommandApplicationService - Application service for command operations
 * @description Handles command authorization, validation, and execution
 */

import { Command } from '../../domain/value-objects/Command';
import { MessagingResult } from '../../domain/value-objects/MessagingResult';
import { MessagingChannel } from '../../domain/enums/MessagingChannel';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { IPendingCommandDomainService } from '../../domain/interfaces/IPendingCommandDomainService';
import { MessagingError } from '../../domain/errors/DomainError';
import { MessagingErrorCode } from '../../domain/errors/ErrorCodes';
import { ValidationUtils } from '../../domain/utils/ValidationUtils';
import { CommandType } from '../../domain/enums/CommandType';

/**
 * Application service for command operations
 */
export class CommandApplicationService {
  private readonly commandMessagingService: ICommandMessagingService;
  private readonly userRepository: IUserRepository;
  private readonly authorizationService: IAuthorizationService;
  private readonly webPubSubService: IWebPubSubService;
  private readonly pendingCommandDomainService: IPendingCommandDomainService;

  /**
   * Creates a new CommandApplicationService instance
   * @param userRepository - User repository for data access
   * @param authorizationService - Authorization service for permission checks
   * @param commandMessagingService - Messaging service for command delivery
   * @param webPubSubService - WebSocket service for broadcasting events
   * @param pendingCommandDomainService - Domain service for pending command operations
   */
  constructor(
    userRepository: IUserRepository,
    authorizationService: IAuthorizationService,
    commandMessagingService: ICommandMessagingService,
    webPubSubService: IWebPubSubService,
    pendingCommandDomainService: IPendingCommandDomainService
  ) {
    this.userRepository = userRepository;
    this.authorizationService = authorizationService;
    this.commandMessagingService = commandMessagingService;
    this.webPubSubService = webPubSubService;
    this.pendingCommandDomainService = pendingCommandDomainService;
  }

  /**
   * Validates if target user can receive commands
   * @param psoEmail - Email of the target PSO
   * @throws ValidationError if target is invalid
   */
  async validateTargetPSO(psoEmail: string): Promise<void> {
    const validatedEmail = ValidationUtils.validateEmailRequired(psoEmail, 'PSO email');
    await ValidationUtils.validateUserIsPSO(this.userRepository, validatedEmail, 'Target user');
  }

  /**
   * Sends a camera command to a PSO
   * @param command - The command to send
   * @param callerId - Optional Azure AD Object ID of the user who initiated the command
   * @returns Promise that resolves to messaging result
   * @throws MessagingError if command delivery fails
   */
  async sendCameraCommand(command: Command, callerId?: string): Promise<MessagingResult> {
    try {
      // Find PSO user to get database ID
      const psoUser = await this.userRepository.findByEmail(command.employeeEmail);
      if (!psoUser) {
        throw new MessagingError(
          `PSO user not found: ${command.employeeEmail}`,
          MessagingErrorCode.COMMAND_DELIVERY_FAILED
        );
      }

      // Find caller user to get database ID and email if callerId provided
      let callerDatabaseId: string | undefined;
      let callerEmail: string | undefined;
      if (callerId) {
        const callerUser = await this.userRepository.findByAzureAdObjectId(callerId);
        if (callerUser) {
          callerDatabaseId = callerUser.id;
          callerEmail = callerUser.email;
        }
      }

      // Create command with caller email for WebSocket payload
      const commandWithInitiator = new Command(
        command.type,
        command.employeeEmail,
        command.timestamp,
        command.reason,
        callerEmail
      );

      // Always create PendingCommand for tracking, even if WebSocket succeeds
      // This ensures we can track who sent the command and notify them if errors occur
      await this.pendingCommandDomainService.createPendingCommand(
        psoUser.id,
        command.type,
        command.timestamp,
        command.reason,
        callerDatabaseId
      );

      // Use the existing CommandMessagingService to send the command with initiator email
      const groupName = `commands:${command.employeeEmail}`;
      await this.commandMessagingService.sendToGroup(groupName, commandWithInitiator.toPayload() as Record<string, unknown>);
      
      // Broadcast stream event to supervisors
      await this.broadcastStreamEvent(command.employeeEmail, command.type, command.reason);
      
      return new MessagingResult(MessagingChannel.WebSocket, true);
    } catch (error) {
      throw new MessagingError(
        `Failed to send command: ${(error as Error).message}`,
        MessagingErrorCode.COMMAND_DELIVERY_FAILED
      );
    }
  }

  /**
   * Determines the status string based on command type
   * @param command - The command type
   * @returns Status string or null if command type is not supported
   * @private
   */
  private getStatusFromCommand(command: CommandType): string | null {
    if (command === CommandType.START) {
      return 'pending';
    }
    if (command === CommandType.STOP) {
      return 'stopped';
    }
    return null;
  }

  /**
   * Broadcasts stream events to supervisors via WebSocket
   * @param email - The email of the PSO
   * @param command - The command type (START/STOP)
   * @param reason - Optional reason for the command
   * @private
   */
  private async broadcastStreamEvent(email: string, command: CommandType, reason?: string): Promise<void> {
    try {
      const status = this.getStatusFromCommand(command);

      if (!status) {
        return;
      }
      const message: any = {
        email: email,
        status: status
      };
      
      // Include reason for STOP commands
      if (command === CommandType.STOP && reason) {
        message.reason = reason;
      }
      // Send to the PSO's group so supervisors can receive the event
      await this.webPubSubService.broadcastMessage(email, message);
      
   } catch {
      // WebSocket failure shouldn't break command processing
    }
  }
}
