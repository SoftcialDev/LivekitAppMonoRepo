/**
 * @fileoverview TalkSessionApplicationService - Application service for talk session operations
 * @summary Orchestrates talk session operations
 * @description Handles orchestration of domain services for talk session operations
 */

import { TalkSessionStartRequest } from '../../domain/value-objects/TalkSessionStartRequest';
import { TalkSessionStartResponse } from '../../domain/value-objects/TalkSessionStartResponse';
import { TalkSessionStopRequest } from '../../domain/value-objects/TalkSessionStopRequest';
import { TalkSessionStopResponse } from '../../domain/value-objects/TalkSessionStopResponse';
import { TalkSessionDomainService } from '../../domain/services/TalkSessionDomainService';

/**
 * Application service for handling talk session operations
 * @description Orchestrates domain services for talk sessions
 */
export class TalkSessionApplicationService {
  /**
   * Creates a new TalkSessionApplicationService instance
   * @param talkSessionDomainService - Domain service for talk session business logic
   */
  constructor(
    private readonly talkSessionDomainService: TalkSessionDomainService
  ) {}

  /**
   * Starts a talk session between supervisor and PSO
   * @param callerId - The Azure AD Object ID of the supervisor
   * @param request - The talk session start request
   * @returns Promise that resolves to the talk session start response
   * @throws UserNotFoundError when supervisor or PSO is not found
   */
  async startTalkSession(callerId: string, request: TalkSessionStartRequest): Promise<TalkSessionStartResponse> {
    return await this.talkSessionDomainService.startTalkSession(request);
  }

  /**
   * Stops a talk session
   * @param request - The talk session stop request
   * @returns Promise that resolves to the talk session stop response
   */
  async stopTalkSession(request: TalkSessionStopRequest): Promise<TalkSessionStopResponse> {
    return await this.talkSessionDomainService.stopTalkSession(request);
  }
}

