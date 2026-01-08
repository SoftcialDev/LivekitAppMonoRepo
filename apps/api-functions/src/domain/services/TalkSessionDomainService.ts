/**
 * @fileoverview TalkSessionDomainService - Domain service for talk session operations
 * @summary Handles business logic for talk sessions
 * @description Encapsulates the business rules and operations for talk sessions
 */

import { ITalkSessionRepository } from '../interfaces/ITalkSessionRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IWebPubSubService } from '../interfaces/IWebPubSubService';
import { TalkSessionStartRequest } from '../value-objects/TalkSessionStartRequest';
import { TalkSessionStartResponse } from '../value-objects/TalkSessionStartResponse';
import { TalkSessionStopRequest } from '../value-objects/TalkSessionStopRequest';
import { TalkSessionStopResponse } from '../value-objects/TalkSessionStopResponse';
import { UserNotFoundError } from '../errors/UserErrors';
import { TalkSessionAlreadyActiveError } from '../errors/TalkSessionErrors';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain service for handling talk session operations
 * @description Encapsulates business logic for talk sessions
 */
export class TalkSessionDomainService {
  /**
   * Creates a new TalkSessionDomainService instance
   * @param talkSessionRepository - Repository for talk session data access
   * @param userRepository - Repository for user data access
   * @param webPubSubService - Service for WebSocket broadcasting
   */
  constructor(
    private readonly talkSessionRepository: ITalkSessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Starts a new talk session between supervisor and PSO
   * @param request - The talk session start request
   * @returns Promise that resolves to the talk session start response
   * @throws UserNotFoundError when supervisor or PSO is not found
   * @throws TalkSessionAlreadyActiveError when PSO already has an active talk session
   */
  async startTalkSession(request: TalkSessionStartRequest): Promise<TalkSessionStartResponse> {
    const supervisor = await this.findUserByAzureAdObjectId(request.callerId);
    const pso = await this.findUserByEmail(request.psoEmail);

    // Check if PSO already has an active talk session
    const activeSessions = await this.talkSessionRepository.getActiveTalkSessionsForPso(pso.id);
    if (activeSessions.length > 0) {
      const activeSession = activeSessions[0];
      const supervisorInfo = await this.userRepository.findById(activeSession.supervisorId);
      const supervisorEmail = supervisorInfo?.email || 'another supervisor';
      throw new TalkSessionAlreadyActiveError(
        `PSO already has an active talk session with ${supervisorEmail}`,
        activeSession.id
      );
    }

    const startedAt = getCentralAmericaTime();
    const talkSession = await this.talkSessionRepository.createTalkSession({
      supervisorId: supervisor.id,
      psoId: pso.id,
      startedAt
    });

    await this.broadcastTalkStartedEvent(
      supervisor.email,
      supervisor.fullName,
      pso.email
    );

    return new TalkSessionStartResponse(
      talkSession.id,
      `Talk session started between ${supervisor.email} and ${pso.email}`
    );
  }

  /**
   * Stops a talk session
   * @param request - The talk session stop request
   * @returns Promise that resolves to the talk session stop response
   */
  async stopTalkSession(request: TalkSessionStopRequest): Promise<TalkSessionStopResponse> {
    const sessionWithPso = await this.talkSessionRepository.findByIdWithPso(request.talkSessionId);

    await this.talkSessionRepository.stopTalkSession(
      request.talkSessionId,
      request.stopReason
    );

    if (sessionWithPso) {
      await this.broadcastTalkStoppedEvent(sessionWithPso.psoEmail);
    }

    return new TalkSessionStopResponse(
      `Talk session stopped (${request.stopReason})`
    );
  }

  /**
   * Finds a user by Azure AD Object ID
   * @param azureAdObjectId - The Azure AD Object ID to search for
   * @returns Promise that resolves to the user
   * @throws UserNotFoundError when the user is not found
   * @private
   */
  private async findUserByAzureAdObjectId(azureAdObjectId: string): Promise<{ id: string; email: string; fullName: string }> {
    const user = await this.userRepository.findByAzureAdObjectId(azureAdObjectId);
    
    if (!user) {
      throw new UserNotFoundError(`User not found for Azure AD Object ID: ${azureAdObjectId}`);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    };
  }

  /**
   * Finds a user by email
   * @param email - The email to search for
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
   * Broadcasts talk started event to PSO via WebSocket
   * @param supervisorEmail - The supervisor's email
   * @param supervisorName - The supervisor's full name
   * @param psoEmail - The PSO's email
   * @private
   */
  private async broadcastTalkStartedEvent(
    supervisorEmail: string,
    supervisorName: string,
    psoEmail: string
  ): Promise<void> {
    try {
      const message = {
        type: 'talk_session_start',
        supervisorEmail,
        supervisorName,
        psoEmail: psoEmail.toLowerCase().trim(),
        timestamp: new Date().toISOString()
      };

      await this.webPubSubService.broadcastMessage(psoEmail.toLowerCase().trim(), message);
    } catch {
      // Failed to broadcast - don't fail the operation
    }
  }

  /**
   * Broadcasts talk stopped event to PSO via WebSocket
   * @param psoEmail - The PSO's email
   * @public - Made public so WebSocketConnectionDomainService can use it
   */
  async broadcastTalkStoppedEvent(psoEmail: string): Promise<void> {
    try {
      const message = {
        type: 'talk_session_stop',
        psoEmail: psoEmail.toLowerCase().trim(),
        timestamp: new Date().toISOString()
      };

      await this.webPubSubService.broadcastMessage(psoEmail.toLowerCase().trim(), message);
    } catch {
      // Failed to broadcast - don't fail the operation
    }
  }
}

