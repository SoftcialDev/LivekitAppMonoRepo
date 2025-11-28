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
   */
  constructor(
    private readonly presenceDomainService: PresenceDomainService,
    private readonly streamingSessionDomainService: StreamingSessionDomainService,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Handles WebSocket connection event
   * @param request - The WebSocket event request
   * @returns Promise that resolves to the WebSocket event response
   * @example
   * const response = await webSocketConnectionDomainService.handleConnection(request);
   */
  async handleConnection(request: WebSocketEventRequest): Promise<WebSocketEventResponse> {
    try {
      if (!request.userId) return WebSocketEventResponse.error("Missing userId in connection event");
      
      await this.presenceDomainService.setUserOnline(request.userId);

      try {
        await this.webPubSubService.syncAllUsersWithDatabase();
      } catch (e: any) {
        console.error("Sync on connect failed:", e?.message ?? e);
      }

      return WebSocketEventResponse.success(`User ${request.userId} connected successfully`);
    } catch (error: any) {
      console.error("Failed to handle connection:", error);
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
  async handleDisconnection(request: WebSocketEventRequest, context?: any): Promise<WebSocketEventResponse> {
    try {
      if (!request.userId) return WebSocketEventResponse.error("Missing userId in disconnection event");

      await this.presenceDomainService.setUserOffline(request.userId, context);
      await this.streamingSessionDomainService.stopStreamingSession(request.userId, 'DISCONNECT', context);

      try {
        await this.webPubSubService.syncAllUsersWithDatabase();
      } catch (e: any) {
        console.error("Sync after disconnection failed:", e?.message ?? e);
      }
      
      return WebSocketEventResponse.success(`User ${request.userId} disconnected successfully`);
    } catch (error: any) {
      console.error("Failed to handle disconnection:", error);
      return WebSocketEventResponse.error(`Failed to handle disconnection: ${error.message}`);
    }
  }
}
