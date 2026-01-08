/**
 * @fileoverview StreamingSessionUpdateApplicationService - Application service for streaming session update operations
 * @summary Orchestrates streaming session updates
 * @description Handles orchestration of domain services for streaming session update operations
 */

import { StreamingSessionUpdateRequest } from '../../domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingSessionUpdateResponse } from '../../domain/value-objects/StreamingSessionUpdateResponse';
import { StreamingSessionUpdateDomainService } from '../../domain/services';
import { AuthorizationService } from '../../domain/services/AuthorizationService';

/**
 * Application service for handling streaming session update operations
 * @description Orchestrates domain services for streaming session updates
 */
export class StreamingSessionUpdateApplicationService {
  /**
   * Creates a new StreamingSessionUpdateApplicationService instance
   * @param streamingSessionUpdateDomainService - Domain service for streaming session update business logic
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly streamingSessionUpdateDomainService: StreamingSessionUpdateDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Updates a streaming session for a user
   * @param callerId - The ID of the user making the request
   * @param request - The streaming session update request
   * @returns Promise that resolves to the streaming session update response
   * @throws UserNotFoundError when user is not found
   * @example
   * const response = await streamingSessionUpdateApplicationService.updateStreamingSession(callerId, request);
   */
  async updateStreamingSession(callerId: string, request: StreamingSessionUpdateRequest): Promise<StreamingSessionUpdateResponse> {
    return await this.streamingSessionUpdateDomainService.updateStreamingSession(request);
  }
}
