/**
 * @fileoverview FetchStreamingSessionHistoryApplicationService - Application service for fetching streaming session history
 * @summary Orchestrates the flow for fetching streaming session history
 * @description Provides application service for streaming session history operations
 */

import { IStreamingSessionDomainService } from '../../domain/interfaces/IStreamingSessionDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { FetchStreamingSessionHistoryResponse } from '../../domain/value-objects/FetchStreamingSessionHistoryResponse';
import { StreamingSessionAccessDeniedError } from '../../domain/errors/StreamingSessionErrors';

/**
 * Application service for fetching streaming session history
 * Orchestrates the flow and handles authorization
 */
export class FetchStreamingSessionHistoryApplicationService {
  constructor(
    private readonly streamingSessionDomainService: IStreamingSessionDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Fetches streaming session history for the authenticated user
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming session response
   * @throws StreamingSessionAccessDeniedError when authorization fails
   */
  async fetchStreamingSessionHistory(callerId: string): Promise<FetchStreamingSessionHistoryResponse> {
    // Use AuthorizationService to validate user exists and has Employee role
    await this.authorizationService.canAccessContactManager(callerId);

    return await this.streamingSessionDomainService.fetchLatestSessionForUser(callerId);
  }
}
