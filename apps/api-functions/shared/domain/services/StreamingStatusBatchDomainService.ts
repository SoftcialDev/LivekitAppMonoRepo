/**
 * @fileoverview StreamingStatusBatchDomainService - Domain service for batch streaming status operations
 * @summary Encapsulates business logic for batch streaming status domain
 * @description Provides domain service for batch streaming status business logic
 */

import { IStreamingSessionRepository } from '../interfaces/IStreamingSessionRepository';
import { StreamingStatusBatchResponse } from '../value-objects/StreamingStatusBatchResponse';

/**
 * Domain service for batch streaming status operations
 * Encapsulates business logic for batch streaming status domain
 */
export class StreamingStatusBatchDomainService {
  constructor(
    private readonly streamingSessionRepository: IStreamingSessionRepository
  ) {}

  /**
   * Gets batch streaming status for multiple emails
   * @param emails - Array of email addresses
   * @returns Promise that resolves to batch streaming status response
   * @throws Error if the operation fails
   */
  async getBatchStreamingStatus(emails: string[]): Promise<StreamingStatusBatchResponse> {
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
