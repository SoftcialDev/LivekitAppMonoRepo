/**
 * @fileoverview StreamingStatusBatchApplicationService - Application service for batch streaming status operations
 * @summary Orchestrates the flow for batch streaming status operations
 * @description Provides application service for batch streaming status operations
 */

import { IStreamingSessionRepository } from '../../domain/interfaces/IStreamingSessionRepository';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { StreamingStatusBatchResponse } from '../../domain/value-objects/StreamingStatusBatchResponse';

/**
 * Application service for batch streaming status operations
 * Orchestrates the flow and handles authorization
 */
export class StreamingStatusBatchApplicationService {
  constructor(
    private readonly streamingSessionRepository: IStreamingSessionRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Gets batch streaming status for multiple emails
   * @param emails - Array of email addresses
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to batch streaming status response
   * @throws Error when authorization fails
   */
  async getBatchStatus(emails: string[], callerId: string): Promise<StreamingStatusBatchResponse> {
    await this.authorizationService.canAccessStreamingStatus(callerId);
    
    const sessionsData = await this.streamingSessionRepository.getLatestSessionsForEmails(emails);
    
    const statuses = sessionsData.map(({ email, session }) => {
      if (!session) {
        return { email, hasActiveSession: false, lastSession: null };
      }

      const hasActiveSession = !session.stoppedAt;
      const lastSession = {
        stopReason: session.stopReason,
        stoppedAt: session.stoppedAt?.toISOString() || null
      };

      return { email, hasActiveSession, lastSession };
    });

    return new StreamingStatusBatchResponse(statuses);
  }
}
