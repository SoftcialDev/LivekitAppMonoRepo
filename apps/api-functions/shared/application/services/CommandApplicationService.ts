/**
 * @fileoverview CommandApplicationService - Application service for command operations
 * @description Handles command authorization, validation, and execution
 */

import { Command } from '../../domain/value-objects/Command';
import { MessagingResult } from '../../domain/value-objects/MessagingResult';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import {  MessagingError } from '../../domain/errors/DomainError';
import {  MessagingErrorCode } from '../../domain/errors/ErrorCodes';
import { ValidationUtils } from '../../domain/utils/ValidationUtils';
import { AuthorizationUtils } from '../../domain/utils/AuthorizationUtils';

/**
 * Application service for command operations
 */
export class CommandApplicationService {
  private commandMessagingService: ICommandMessagingService;
  private userRepository: IUserRepository;
  private authorizationService: IAuthorizationService;

  /**
   * Creates a new CommandApplicationService instance
   * @param userRepository - User repository for data access
   * @param authorizationService - Authorization service for permission checks
   * @param commandMessagingService - Messaging service for command delivery
   */
  constructor(
    userRepository: IUserRepository,
    authorizationService: IAuthorizationService,
    commandMessagingService: ICommandMessagingService
  ) {
    this.userRepository = userRepository;
    this.authorizationService = authorizationService;
    this.commandMessagingService = commandMessagingService;
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
      
      return { success: true, sentVia: 'WEB_PUBSUB' as any };
    } catch (error) {
      throw new MessagingError(
        `Failed to send command: ${(error as Error).message}`,
        MessagingErrorCode.COMMAND_DELIVERY_FAILED
      );
    }
  }
}
