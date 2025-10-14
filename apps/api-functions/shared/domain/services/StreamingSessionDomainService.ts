/**
 * @fileoverview StreamingSessionDomainService - Domain service for streaming session operations
 * @summary Encapsulates business logic for streaming session domain operations
 * @description Provides domain service for streaming session business logic
 */

import { IStreamingSessionRepository } from '../interfaces/IStreamingSessionRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IStreamingSessionDomainService } from '../interfaces/IStreamingSessionDomainService';
import { FetchStreamingSessionHistoryResponse } from '../value-objects/FetchStreamingSessionHistoryResponse';
import { FetchStreamingSessionsResponse } from '../value-objects/FetchStreamingSessionsResponse';
import { 
  StreamingSessionFetchError 
} from '../errors/StreamingSessionErrors';
import { UserRole } from '@prisma/client';

/**
 * Domain service for streaming session operations
 * Encapsulates business logic for streaming session domain
 */
export class StreamingSessionDomainService implements IStreamingSessionDomainService {
  constructor(
    private readonly streamingSessionRepository: IStreamingSessionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Fetches the latest streaming session for a user
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming session response
   * @throws StreamingSessionFetchError when fetch operation fails
   */
  async fetchLatestSessionForUser(callerId: string): Promise<FetchStreamingSessionHistoryResponse> {
    try {
      // User validation is already done in Application Service
      const user = await this.userRepository.findByAzureAdObjectId(callerId);
      const latestSession = await this.streamingSessionRepository.getLatestSessionForUser(user!.id);
      
      if (!latestSession) {
        return FetchStreamingSessionHistoryResponse.withNoSession();
      }

      return FetchStreamingSessionHistoryResponse.withSession(latestSession);
    } catch (error) {
      throw new StreamingSessionFetchError(`Failed to fetch streaming session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches all active streaming sessions based on user role
   * @param callerId - The caller's Azure AD Object ID
   * @returns Promise that resolves to streaming sessions response
   * @throws StreamingSessionFetchError when fetch operation fails
   */
  async getAllActiveSessions(callerId: string): Promise<FetchStreamingSessionsResponse> {
    try {
      // User validation is already done in Application Service
      const user = await this.userRepository.findByAzureAdObjectId(callerId);
      
      if (user!.role === UserRole.Admin || user!.role === UserRole.SuperAdmin) {
        // Admin and SuperAdmin see all active sessions
        const allSessions = await this.streamingSessionRepository.getActiveSessions();
        return FetchStreamingSessionsResponse.withSessions(allSessions);
      }
      
      if (user!.role === UserRole.Supervisor) {
        // Supervisor sees only sessions of their assigned PSOs
        const supervisorSessions = await this.streamingSessionRepository.getActiveSessionsForSupervisor(user!.id);
        return FetchStreamingSessionsResponse.withSessions(supervisorSessions);
      }
      
      // If no valid role, return empty sessions
      return FetchStreamingSessionsResponse.withNoSessions();
    } catch (error) {
      throw new StreamingSessionFetchError(`Failed to fetch streaming sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
