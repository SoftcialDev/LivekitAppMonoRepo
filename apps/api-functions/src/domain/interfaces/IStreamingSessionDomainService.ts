/**
 * @fileoverview IStreamingSessionDomainService - Interface for streaming session domain operations
 * @summary Defines the contract for streaming session domain service
 * @description Provides the interface for streaming session domain operations
 */

import { FetchStreamingSessionHistoryResponse } from '../value-objects/FetchStreamingSessionHistoryResponse';
import { FetchStreamingSessionsResponse } from '../value-objects/FetchStreamingSessionsResponse';
import { Platform } from '../enums/Platform';

/**
 * Interface for streaming session domain service
 * Defines the contract for domain operations related to streaming sessions
 */
export interface IStreamingSessionDomainService {
  /**
   * Fetches the latest streaming session for a user
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming session response
   * @throws StreamingSessionUserNotFoundError when user is not found
   * @throws StreamingSessionFetchError when fetch operation fails
   */
  fetchLatestSessionForUser(callerId: string): Promise<FetchStreamingSessionHistoryResponse>;

  /**
   * Fetches all active streaming sessions based on user role
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming sessions response
   * @throws StreamingSessionFetchError when fetch operation fails
   */
  getAllActiveSessions(callerId: string): Promise<FetchStreamingSessionsResponse>;

  /**
   * Starts a new streaming session for a user
   * @param userId - The ID of the user (can be email or UUID)
   * @param platform - Optional platform identifier (electron or browser)
   * @returns Promise that resolves when the session is started
   * @throws Error if the operation fails
   */
  startStreamingSession(userId: string, platform?: Platform): Promise<void>;
}
