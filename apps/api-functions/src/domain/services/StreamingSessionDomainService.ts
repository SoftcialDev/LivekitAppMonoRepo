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
import { StreamingSessionHistory } from '../entities/StreamingSessionHistory';
import { 
  StreamingSessionFetchError 
} from '../errors/StreamingSessionErrors';
import { UserNotFoundError } from '../errors/UserErrors';
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
   * Starts a new streaming session for a user
   * @param userId - The ID of the user (can be email or UUID)
   * @returns Promise that resolves when the session is started
   * @throws Error if the operation fails
   */
  async startStreamingSession(userId: string): Promise<void> {
    const databaseUserId = await this.convertUserIdToDatabaseId(userId);
    await this.streamingSessionRepository.startStreamingSession(databaseUserId);
  }

  /**
   * Stops a streaming session for a user
   * @param userId - The ID of the user (can be email or UUID)
   * @param reason - The reason for stopping the session
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves to the updated session with stoppedAt, or null if no session was found
   * @throws Error if the operation fails
   */
  async stopStreamingSession(userId: string, reason: string, context?: Record<string, unknown>): Promise<StreamingSessionHistory | null> {
    const databaseUserId = await this.convertUserIdToDatabaseId(userId);
    return await this.streamingSessionRepository.stopStreamingSession(databaseUserId, reason, context);
  }

  /**
   * Gets the last streaming session for a user
   * @param userId - The ID of the user
   * @returns Promise that resolves to the last session or null
   * @throws Error if the operation fails
   */
  async getLastStreamingSession(userId: string): Promise<StreamingSessionHistory | null> {
    return await this.streamingSessionRepository.getLastStreamingSession(userId);
  }

  /**
   * Checks if a user is currently streaming
   * @param userId - The ID of the user
   * @returns Promise that resolves to true if streaming, false otherwise
   * @throws Error if the operation fails
   */
  async isUserStreaming(userId: string): Promise<boolean> {
    return await this.streamingSessionRepository.isUserStreaming(userId);
  }

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

  /**
   * Converts a userId (which can be an email, UUID, or Azure AD Object ID) to a database user ID
   * @param userId - The user identifier (can be email, UUID, or Azure AD Object ID)
   * @returns Promise that resolves to the database user ID
   * @throws UserNotFoundError if the user is not found
   */
  private async convertUserIdToDatabaseId(userId: string): Promise<string> {
    // Check if userId is an email (contains @) or UUID (contains -)
    const isEmail = userId.includes('@');
    const isUUID = userId.includes('-') && !userId.includes('@');
    
    if (isEmail) {
      // If it's an email, find the user by email to get the database ID
      const user = await this.userRepository.findByEmail(userId);
      if (!user) {
        throw new UserNotFoundError(`User not found for email: ${userId}`);
      }
      return user.id;
    }
    
    if (!isUUID) {
      // If it's neither email nor UUID, try to find by Azure AD Object ID
      const user = await this.userRepository.findByAzureAdObjectId(userId);
      if (!user) {
        throw new UserNotFoundError(`User not found for ID: ${userId}`);
      }
      return user.id;
    }
    
    // If it's a UUID, return it as-is (it's already a database ID)
    return userId;
  }
}
