/**
 * @fileoverview WebSocketConnectionDomainService - Domain service for WebSocket connection operations
 * @summary Handles WebSocket connection business logic
 * @description Contains the core business logic for WebSocket connection and disconnection events
 */

import { WebSocketEventRequest } from "../value-objects/WebSocketEventRequest";
import { WebSocketEventResponse } from "../value-objects/WebSocketEventResponse";
import { PresenceDomainService } from "./PresenceDomainService";
import { StreamingSessionDomainService } from "./StreamingSessionDomainService";
import { IWebPubSubService } from "../interfaces/IWebPubSubService";
import { IUserRepository } from "../interfaces/IUserRepository";
import { ITalkSessionRepository } from "../interfaces/ITalkSessionRepository";
import { TalkSessionDomainService } from "./TalkSessionDomainService";
import { TalkStopReason } from "../enums/TalkStopReason";
import { UserRole } from "../enums/UserRole";
import { LiveKitRecordingService } from '../../infrastructure/services/LiveKitRecordingService';
import { logError } from '../../utils/logger';
import { extractErrorMessage } from '../../utils/error/ErrorHelpers';
import { Context } from "@azure/functions";

/**
 * Domain service for WebSocket connection business logic
 * @description Handles the core business rules for WebSocket connection events
 */
export class WebSocketConnectionDomainService {
  /**
   * Creates a new WebSocketConnectionDomainService instance
   * @param presenceDomainService - Domain service for presence operations
   * @param streamingSessionDomainService - Domain service for streaming session operations
   * @param webPubSubService - Service for WebPubSub operations and sync
   * @param userRepository - Repository for user data access
   * @param liveKitRecordingService - Service for LiveKit recording operations
   * @param talkSessionRepository - Repository for talk session data access
   * @param talkSessionDomainService - Domain service for talk session operations
   */
  constructor(
    private readonly presenceDomainService: PresenceDomainService,
    private readonly streamingSessionDomainService: StreamingSessionDomainService,
    private readonly webPubSubService: IWebPubSubService,
    private readonly userRepository: IUserRepository,
    private readonly liveKitRecordingService: LiveKitRecordingService,
    private readonly talkSessionRepository: ITalkSessionRepository,
    private readonly talkSessionDomainService: TalkSessionDomainService
  ) {}

  /**
   * Handles WebSocket connection event
   * @param request - The WebSocket event request
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves to the WebSocket event response
   * @example
   * const response = await webSocketConnectionDomainService.handleConnection(request, context);
   */
  async handleConnection(request: WebSocketEventRequest, context?: Context): Promise<WebSocketEventResponse> {
    try {
      if (!request.userId) return WebSocketEventResponse.error("Missing userId in connection event");
      
      await this.presenceDomainService.setUserOnline(request.userId);

      try {
        await this.webPubSubService.syncAllUsersWithDatabase();
      } catch (e: unknown) {
        if (context) {
          logError(context, e instanceof Error ? e : new Error(String(e)), { operation: 'syncAllUsersWithDatabase', event: 'connection' });
        }
      }

      return WebSocketEventResponse.success(`User ${request.userId} connected successfully`);
    } catch (error: unknown) {
      if (context) {
        logError(context, error instanceof Error ? error : new Error(String(error)), { operation: 'handleConnection', userId: request.userId });
      }
      const errorMessage = extractErrorMessage(error);
      return WebSocketEventResponse.error(`Failed to handle connection: ${errorMessage}`);
    }
  }

  /**
   * Handles WebSocket disconnection event
   * @param request - The WebSocket event request
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves to the WebSocket event response
   * @example
   * const response = await webSocketConnectionDomainService.handleDisconnection(request, context);
   */
  /**
   * @description Handles WebSocket disconnection event, including stopping active recordings
   * @param request - The WebSocket event request
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves to the WebSocket event response
   */
  async handleDisconnection(request: WebSocketEventRequest, context?: Context): Promise<WebSocketEventResponse> {
    try {
      if (!request.userId) return WebSocketEventResponse.error("Missing userId in disconnection event");

      const user = await this.userRepository.findByEmail(request.userId);
      if (!user) {
        return WebSocketEventResponse.error(`User not found: ${request.userId}`);
      }

      await this.closeActiveTalkSessions(user.id, user.role as UserRole, request.userId, context);
      await this.stopActiveRecordings(user.id, request.userId, context);
      await this.updatePresenceAndStreaming(request.userId, context);
      await this.syncUsersWithDatabase(context);

      return WebSocketEventResponse.success(`User ${request.userId} disconnected successfully`);
    } catch (error: unknown) {
      if (context) {
        logError(context, error instanceof Error ? error : new Error(String(error)), { operation: 'handleDisconnection', userId: request.userId });
      }
      const errorMessage = extractErrorMessage(error);
      return WebSocketEventResponse.error(`Failed to handle disconnection: ${errorMessage}`);
    }
  }

  /**
   * Closes all active talk sessions for a disconnected user
   * @param userId - The user's database ID
   * @param userRole - The user's role
   * @param userEmail - The user's email (for logging)
   * @param context - Optional Azure Functions context for logging
   * @private
   */
  private async closeActiveTalkSessions(
    userId: string,
    userRole: UserRole,
    userEmail: string,
    context?: Context
  ): Promise<void> {
    try {
      const isSupervisorOrAdmin = userRole === UserRole.Supervisor || 
                                  userRole === UserRole.Admin || 
                                  userRole === UserRole.SuperAdmin;
      
      let supervisorSessionsCount = 0;
      if (isSupervisorOrAdmin) {
        const supervisorSessions = await this.talkSessionRepository.getActiveTalkSessionsForSupervisor(userId);
        supervisorSessionsCount = supervisorSessions.length;
        for (const session of supervisorSessions) {
          await this.talkSessionRepository.stopTalkSession(
            session.id,
            TalkStopReason.SUPERVISOR_DISCONNECTED
          );
          const pso = await this.userRepository.findById(session.psoId);
          if (pso) {
            await this.talkSessionDomainService.broadcastTalkStoppedEvent(pso.email);
          }
        }
      }

      const psoSessions = await this.talkSessionRepository.getActiveTalkSessionsForPso(userId);
      for (const session of psoSessions) {
        await this.talkSessionRepository.stopTalkSession(
          session.id,
          TalkStopReason.PSO_DISCONNECTED
        );
        await this.talkSessionDomainService.broadcastTalkStoppedEvent(userEmail);
      }

      const totalSessions = supervisorSessionsCount + psoSessions.length;
      if (totalSessions > 0 && context) {
        context.log.info(`[WebSocketDisconnection] Closed ${totalSessions} active talk session(s) for user ${userEmail}`);
      }
    } catch (error: unknown) {
      if (context) {
        const errorMessage = extractErrorMessage(error);
        context.log.warn(`[WebSocketDisconnection] Failed to close talk sessions: ${errorMessage}`);
      }
    }
  }

  /**
   * Stops all active recordings for a disconnected user
   * @param userId - The user's database ID
   * @param userEmail - The user's email (for logging)
   * @param context - Optional Azure Functions context for logging
   * @private
   */
  private async stopActiveRecordings(
    userId: string,
    userEmail: string,
    context?: Context
  ): Promise<void> {
    try {
      const stopResult = await this.liveKitRecordingService.stopAllForUser(userId);
      if (stopResult.total > 0 && context) {
        context.log.info(`[WebSocketDisconnection] Stopped ${stopResult.completed}/${stopResult.total} active recording(s) for user ${userEmail}`);
      }
    } catch (error: unknown) {
      if (context) {
        const errorMessage = extractErrorMessage(error);
        context.log.warn(`[WebSocketDisconnection] Failed to stop recording on disconnect: ${errorMessage}`);
      }
    }
  }

  /**
   * Updates user presence and stops streaming session
   * @param userEmail - The user's email
   * @param context - Optional Azure Functions context for logging
   * @private
   */
  private async updatePresenceAndStreaming(
    userEmail: string,
    context?: Context
  ): Promise<void> {
    const contextRecord = context ? { invocationId: context.invocationId } as Record<string, unknown> : undefined;
    await this.presenceDomainService.setUserOffline(userEmail, contextRecord);
    await this.streamingSessionDomainService.stopStreamingSession(userEmail, 'DISCONNECT', contextRecord);
  }

  /**
   * Syncs all users with database
   * @param context - Optional Azure Functions context for logging
   * @private
   */
  private async syncUsersWithDatabase(context?: Context): Promise<void> {
    try {
      await this.webPubSubService.syncAllUsersWithDatabase();
    } catch (error: unknown) {
      if (context) {
        logError(context, error instanceof Error ? error : new Error(String(error)), { operation: 'syncAllUsersWithDatabase', event: 'disconnection' });
      }
    }
  }
}
