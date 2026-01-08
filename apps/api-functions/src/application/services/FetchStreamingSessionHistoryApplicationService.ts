/**
 * @fileoverview FetchStreamingSessionHistoryApplicationService - Application service for fetching streaming session history
 * @summary Orchestrates the flow for fetching streaming session history
 * @description Provides application service for streaming session history operations
 */

import { IStreamingSessionDomainService } from '../../domain/interfaces/IStreamingSessionDomainService';
import { FetchStreamingSessionHistoryResponse } from '../../domain/value-objects/FetchStreamingSessionHistoryResponse';

/**
 * Application service for fetching streaming session history
 * Orchestrates the flow and handles authorization
 */
export class FetchStreamingSessionHistoryApplicationService {
  constructor(
    private readonly streamingSessionDomainService: IStreamingSessionDomainService
  ) {}

  /**
   * Fetches streaming session history for the authenticated user
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming session response
   */
  async fetchStreamingSessionHistory(callerId: string): Promise<FetchStreamingSessionHistoryResponse> {
    // Permission check is done at middleware level
    return await this.streamingSessionDomainService.fetchLatestSessionForUser(callerId);
  }
}
