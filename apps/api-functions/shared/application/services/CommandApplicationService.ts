/**
 * @fileoverview CommandApplicationService - Application service for command operations
 * @description Handles command authorization, validation, and execution
 */

import { Command } from '../../domain/value-objects/Command';
import { MessagingResult } from '../../domain/value-objects/MessagingResult';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import {  MessagingError } from '../../domain/errors/DomainError';
import {  MessagingErrorCode } from '../../domain/errors/ErrorCodes';
import { ValidationUtils } from '../../domain/utils/ValidationUtils';
import { AuthorizationUtils } from '../../domain/utils/AuthorizationUtils';
import { CommandType } from '../../domain/enums/CommandType';

/**
 * Application service for command operations
 */
export class CommandApplicationService {
  private commandMessagingService: ICommandMessagingService;
  private userRepository: IUserRepository;
  private authorizationService: IAuthorizationService;
  private webPubSubService: IWebPubSubService;

  /**
   * Creates a new CommandApplicationService instance
   * @param userRepository - User repository for data access
   * @param authorizationService - Authorization service for permission checks
   * @param commandMessagingService - Messaging service for command delivery
   * @param webPubSubService - WebSocket service for broadcasting events
   */
  constructor(
    userRepository: IUserRepository,
    authorizationService: IAuthorizationService,
    commandMessagingService: ICommandMessagingService,
    webPubSubService: IWebPubSubService
  ) {
    this.userRepository = userRepository;
    this.authorizationService = authorizationService;
    this.commandMessagingService = commandMessagingService;
    this.webPubSubService = webPubSubService;
  }

  /**
   * Authorizes if a user can send commands
   * @param callerId - Azure AD object ID of the caller
   * @throws AuthError if user is not authorized
   */
  async authorizeCommandSender(callerId: string): Promise<void> {
    await AuthorizationUtils.validateCanSendCommands(this.authorizationService, callerId);
  }

  /**
   * Validates if target user can receive commands
   * @param employeeEmail - Email of the target employee
   * @throws ValidationError if target is invalid
   */
  async validateTargetEmployee(employeeEmail: string): Promise<void> {
    const validatedEmail = ValidationUtils.validateEmailRequired(employeeEmail, 'Employee email');
    await ValidationUtils.validateUserIsEmployee(this.userRepository, validatedEmail, 'Target user');
  }

  /**
   * Sends a camera command to an employee
   * @param command - The command to send
   * @returns Promise that resolves to messaging result
   * @throws MessagingError if command delivery fails
   */
  async sendCameraCommand(command: Command): Promise<MessagingResult> {
    try {
      // Use the existing CommandMessagingService to send the command
      const groupName = `commands:${command.employeeEmail}`;
      await this.commandMessagingService.sendToGroup(groupName, command.toPayload());
      
      // Broadcast stream event to supervisors
      await this.broadcastStreamEvent(command.employeeEmail, command.type, command.reason);
      
      return { success: true, sentVia: 'WEB_PUBSUB' as any };
    } catch (error) {
      throw new MessagingError(
        `Failed to send command: ${(error as Error).message}`,
        MessagingErrorCode.COMMAND_DELIVERY_FAILED
      );
    }
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
      const status = command === CommandType.START ? 'started' : 'stopped';
      const message: any = {
        email: email,
        status: status
      };
      
      // Include reason for STOP commands
      if (command === CommandType.STOP && reason) {
        message.reason = reason;
      }
      
      console.log(`[CommandApplicationService] Broadcasting stream ${status} event for ${email} to group: ${email}`);
      console.log(`[CommandApplicationService] Message:`, message);
      
      // Send to the PSO's group so supervisors can receive the event
      await this.webPubSubService.broadcastMessage(email, message);
      
      console.log(`[CommandApplicationService] ✅ Successfully broadcasted stream ${status} event for ${email}`);
    } catch (error: any) {
      console.error(`[CommandApplicationService] ❌ Failed to broadcast stream event: ${error.message}`);
      console.error(`[CommandApplicationService] Error details:`, error);
      // Don't throw error - WebSocket failure shouldn't break command processing
    }
  }
}
