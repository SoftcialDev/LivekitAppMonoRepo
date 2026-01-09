/**
 * @fileoverview StreamingSessionUpdateDomainService - Domain service for streaming session update operations
 * @summary Handles business logic for streaming session updates
 * @description Encapsulates the business rules and operations for updating streaming sessions
 */

import { StreamingSessionUpdateRequest } from "../value-objects/StreamingSessionUpdateRequest";
import { StreamingSessionUpdateResponse } from "../value-objects/StreamingSessionUpdateResponse";
import { StreamingSessionDomainService } from "./StreamingSessionDomainService";
import { IUserRepository } from "../interfaces/IUserRepository";
import { StreamingStatus } from "../enums/StreamingStatus";
import { UserNotFoundError } from "../errors/UserErrors";
import { IWebPubSubService } from "../interfaces/IWebPubSubService";

/**
 * Domain service for handling streaming session update operations
 * @description Encapsulates business logic for updating streaming sessions
 */
export class StreamingSessionUpdateDomainService {
  /**
   * Creates a new StreamingSessionUpdateDomainService instance
   * @param streamingSessionDomainService - Domain service for streaming session operations
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly streamingSessionDomainService: StreamingSessionDomainService,
    private readonly userRepository: IUserRepository,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Updates a streaming session for a user
   * @param request - The streaming session update request
   * @returns Promise that resolves to the streaming session update response
   * @throws UserNotFoundError when the user is not found
   * @example
   * const response = await streamingSessionUpdateDomainService.updateStreamingSession(request);
   */
  async updateStreamingSession(request: StreamingSessionUpdateRequest): Promise<StreamingSessionUpdateResponse> {
    // 1. Find user by Azure AD Object ID
    const user = await this.findUserByAzureAdObjectId(request.callerId);
    
    // 2. Start or stop streaming session based on status
    if (request.status === StreamingStatus.Started) {
      try {
        await this.streamingSessionDomainService.startStreamingSession(user.id);
        await this.broadcastStreamEvent(user.email, 'started');
        return new StreamingSessionUpdateResponse(
          "Streaming session started",
          StreamingStatus.Started
        );
      } catch (error) {
        await this.broadcastStreamEvent(
          user.email,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    } else {
      // Use provided reason, COMMAND if triggered by command, or DISCONNECT as fallback
      const stopReason = request.reason || (request.isCommand ? 'COMMAND' : 'DISCONNECT');
      try {
        const updatedSession = await this.streamingSessionDomainService.stopStreamingSession(user.id, stopReason);
        await this.broadcastStreamEvent(user.email, 'stopped', stopReason);
        return new StreamingSessionUpdateResponse(
          `Streaming session stopped (${stopReason})`,
          StreamingStatus.Stopped,
          stopReason,
          updatedSession?.stoppedAt?.toISOString()
        );
      } catch (error) {
        await this.broadcastStreamEvent(
          user.email,
          'failed',
          stopReason,
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    }
  }

  /**
   * Finds a user by Azure AD Object ID
   * @param azureAdObjectId - The Azure AD Object ID to search for
   * @returns Promise that resolves to the user
   * @throws UserNotFoundError when the user is not found
   * @private
   */
  private async findUserByAzureAdObjectId(azureAdObjectId: string): Promise<{ id: string; email: string }> {
    const user = await this.userRepository.findByAzureAdObjectId(azureAdObjectId);
    
    if (!user) {
      throw new UserNotFoundError(`User not found for Azure AD Object ID: ${azureAdObjectId}`);
    }

    return {
      id: user.id,
      email: user.email
    };
  }

  /**
   * Broadcasts stream status updates to interested supervisors
   * @param email - The PSO email
   * @param status - The stream status
   * @param reason - Optional stop reason
   * @param errorMessage - Optional error message for failed status
   * @private
   */
  private async broadcastStreamEvent(
    email: string,
    status: 'started' | 'stopped' | 'failed',
    reason?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const message: Record<string, unknown> = {
        email,
        status
      };

      if (reason) {
        message.reason = reason;
      }

      if (errorMessage) {
        message.error = errorMessage;
      }

      await this.webPubSubService.broadcastMessage(email, message);
    } catch {
    }
  }
}
