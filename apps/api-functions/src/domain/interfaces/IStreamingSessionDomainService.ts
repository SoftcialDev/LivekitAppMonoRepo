/**
 * @fileoverview IStreamingSessionDomainService - Interface for streaming session domain operations
 * @summary Defines the contract for streaming session domain service
 * @description Provides the interface for streaming session domain operations
 */

import { FetchStreamingSessionHistoryResponse } from '../value-objects/FetchStreamingSessionHistoryResponse';
import { FetchStreamingSessionsResponse } from '../value-objects/FetchStreamingSessionsResponse';

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
}
