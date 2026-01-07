/**
 * @fileoverview ProcessCommandDomainService - Domain service for process command operations
 * @summary Handles business logic for command processing
 * @description Encapsulates the business rules and operations for processing commands from Service Bus
 */

import { ProcessCommandRequest } from "../value-objects/ProcessCommandRequest";
import { ProcessCommandResponse } from "../value-objects/ProcessCommandResponse";
import { PendingCommandDomainService } from "./PendingCommandDomainService";
import { StreamingSessionDomainService } from "./StreamingSessionDomainService";
import { PresenceDomainService } from "./PresenceDomainService";
import { IUserRepository } from "../interfaces/IUserRepository";
import { ICommandMessagingService } from "../interfaces/ICommandMessagingService";
import { IWebPubSubService } from "../interfaces/IWebPubSubService";
import { CommandType } from "../enums/CommandType";
import { Status } from "../enums/Status";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Domain service for handling process command operations
 * @description Encapsulates business logic for processing commands from Service Bus
 */
export class ProcessCommandDomainService {
  /**
   * Creates a new ProcessCommandDomainService instance
   * @param pendingCommandDomainService - Domain service for pending command operations
   * @param streamingSessionDomainService - Domain service for streaming session operations
   * @param presenceDomainService - Domain service for presence operations
   * @param userRepository - Repository for user data access
   * @param commandMessagingService - Service for command messaging
   * @param webPubSubService - Service for WebSocket broadcasting
   */
  constructor(
    private readonly pendingCommandDomainService: PendingCommandDomainService,
    private readonly streamingSessionDomainService: StreamingSessionDomainService,
    private readonly presenceDomainService: PresenceDomainService,
    private readonly userRepository: IUserRepository,
    private readonly commandMessagingService: ICommandMessagingService,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Processes a command from Service Bus
   * @param request - The process command request
   * @returns Promise that resolves to the process command response
   * @throws UserNotFoundError when the user is not found
   * @example
   * const response = await processCommandDomainService.processCommand(request);
   */
  async processCommand(request: ProcessCommandRequest): Promise<ProcessCommandResponse> {
    // 1. Find user by email
    const user = await this.findUserByEmail(request.employeeEmail);
    
    // 2. Create pending command
    const pendingCommand = await this.pendingCommandDomainService.createPendingCommand(
      user.id,
      request.command,
      request.timestamp,
      request.reason
    );

    // 3. Handle START/STOP commands and broadcast events
    if (request.command === CommandType.START) {
      await this.streamingSessionDomainService.startStreamingSession(user.id);
      // Broadcast START event to supervisors
      await this.broadcastStreamEvent(user.email, 'started');
    } else if (request.command === CommandType.STOP) {
      // Use the provided reason or fallback to 'COMMAND'
      const stopReason = request.reason || 'COMMAND';
      await this.streamingSessionDomainService.stopStreamingSession(user.id, stopReason);
      // Broadcast STOP event to supervisors with reason
      await this.broadcastStreamEvent(user.email, 'stopped', request.reason);
    } else if (request.command === CommandType.REFRESH) {
      // REFRESH doesn't modify streaming sessions, just sends the command
      // No broadcast needed for REFRESH
    }

    // 4. Attempt immediate delivery
    const delivered = await this.attemptDelivery(pendingCommand.id, user.id, user.email, request.command, request.timestamp, request.reason);

    return new ProcessCommandResponse(
      pendingCommand.id,
      delivered,
      `Command ${request.command} for ${request.employeeEmail} processed successfully`
    );
  }

  /**
   * Finds a user by email address
   * @param email - The email address to search for
   * @returns Promise that resolves to the user
   * @throws UserNotFoundError when the user is not found
   * @private
   */
  private async findUserByEmail(email: string): Promise<{ id: string; email: string }> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UserNotFoundError(`User not found for email: ${email}`);
    }

    return {
      id: user.id,
      email: user.email
    };
  }

  /**
   * Attempts to deliver a command immediately via Web PubSub
   * @param commandId - The ID of the pending command
   * @param userId - The ID of the user
   * @param userEmail - The email of the user
   * @param command - The command type
   * @param timestamp - The command timestamp
   * @returns Promise that resolves to whether the command was delivered
   * @private
   */
  private async attemptDelivery(
    commandId: string,
    userId: string,
    userEmail: string,
    command: CommandType,
    timestamp: Date,
    reason?: string
  ): Promise<boolean> {
    try {
      // 1. Check if user is online
      const presenceStatus = await this.presenceDomainService.getPresenceStatus(userId);
      if (presenceStatus !== Status.Online) {
        return false; // User offline, command will be delivered later
      }

      // 2. Send via Web PubSub
      const groupName = `commands:${userEmail.trim().toLowerCase()}`;
      const message: any = {
        id: commandId,
        command: command,
        timestamp: timestamp.toISOString(),
      };
      
      // Include reason if provided
      if (reason) {
        message.reason = reason;
      }

      await this.commandMessagingService.sendToGroup(groupName, message);

      // 3. Mark as published in database
      await this.pendingCommandDomainService.markAsPublished(commandId);
      
      return true;
    } catch {
      // Command is still persisted
      return false;
    }
  }

  /**
   * Broadcasts stream events to supervisors via WebSocket
   * @param email - The email of the PSO
   * @param status - The stream status (started/stopped)
   * @param reason - Optional reason for the command
   * @private
   */
  private async broadcastStreamEvent(email: string, status: 'started' | 'stopped', reason?: string): Promise<void> {
    try {
      const message: any = {
        email: email,
        status: status
      };
      
      // Include reason for STOP commands
      if (status === 'stopped' && reason) {
        message.reason = reason;
      }
      
      // Send to the PSO's group so supervisors can receive the event
      await this.webPubSubService.broadcastMessage(email, message);
    } catch {
      // WebSocket failure shouldn't break command processing
    }
  }

}
