/**
 * @fileoverview FetchStreamingSessionsApplicationService - Application service for fetching streaming sessions
 * @summary Orchestrates the flow for fetching streaming sessions
 * @description Provides application service for streaming sessions operations
 */

import { IStreamingSessionDomainService } from '../../domain/interfaces/IStreamingSessionDomainService';
import { FetchStreamingSessionsResponse } from '../../domain/value-objects/FetchStreamingSessionsResponse';

/**
 * Application service for fetching streaming sessions
 * Orchestrates the flow and handles authorization
 */
export class FetchStreamingSessionsApplicationService {
  constructor(
    private readonly streamingSessionDomainService: IStreamingSessionDomainService
  ) {}

  /**
   * Fetches streaming sessions for the authenticated user based on their role
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming sessions response
   */
  async fetchStreamingSessions(callerId: string): Promise<FetchStreamingSessionsResponse> {
    // Permission check is done at middleware level
    return await this.streamingSessionDomainService.getAllActiveSessions(callerId);
  }
}
