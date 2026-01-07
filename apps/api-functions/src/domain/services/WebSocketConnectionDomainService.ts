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
import { LiveKitRecordingService } from '../../index';
import { Context } from "@azure/functions";
import { logError } from '../../index';

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
   */
  constructor(
    private readonly presenceDomainService: PresenceDomainService,
    private readonly streamingSessionDomainService: StreamingSessionDomainService,
    private readonly webPubSubService: IWebPubSubService,
    private readonly userRepository: IUserRepository,
    private readonly liveKitRecordingService: LiveKitRecordingService
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
      } catch (e: any) {
        if (context) {
          logError(context, e, { operation: 'syncAllUsersWithDatabase', event: 'connection' });
        }
      }

      return WebSocketEventResponse.success(`User ${request.userId} connected successfully`);
    } catch (error: any) {
      if (context) {
        logError(context, error, { operation: 'handleConnection', userId: request.userId });
      }
      return WebSocketEventResponse.error(`Failed to handle connection: ${error.message}`);
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

      // 1. Stop active recordings for the disconnected user
      try {
        const user = await this.userRepository.findByEmail(request.userId);
        if (user) {
          const stopResult = await this.liveKitRecordingService.stopAllForUser(user.id);
          if (stopResult.total > 0 && context) {
            context.log.info(`[WebSocketDisconnection] Stopped ${stopResult.completed}/${stopResult.total} active recording(s) for user ${request.userId}`);
          }
        }
      } catch (recordingError: any) {
        if (context) {
          context.log.warn(`[WebSocketDisconnection] Failed to stop recording on disconnect: ${recordingError.message}`);
        }
      }

      // 2. Set user offline and stop streaming session
      await this.presenceDomainService.setUserOffline(request.userId, context);
      await this.streamingSessionDomainService.stopStreamingSession(request.userId, 'DISCONNECT', context);

      // 3. Sync presence
      try {
        await this.webPubSubService.syncAllUsersWithDatabase();
      } catch (e: any) {
        if (context) {
          logError(context, e, { operation: 'syncAllUsersWithDatabase', event: 'disconnection' });
        }
      }
      
      return WebSocketEventResponse.success(`User ${request.userId} disconnected successfully`);
    } catch (error: any) {
      if (context) {
        logError(context, error, { operation: 'handleDisconnection', userId: request.userId });
      }
      return WebSocketEventResponse.error(`Failed to handle disconnection: ${error.message}`);
    }
  }
}
