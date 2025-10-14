/**
 * @fileoverview WebSocketConnectionDomainService - Domain service for WebSocket connection operations
 * @summary Handles WebSocket connection business logic
 * @description Contains the core business logic for WebSocket connection and disconnection events
 */

import { WebSocketEventRequest } from "../value-objects/WebSocketEventRequest";
import { WebSocketEventResponse } from "../value-objects/WebSocketEventResponse";
import { PresenceDomainService } from "./PresenceDomainService";
import { StreamingSessionDomainService } from "./StreamingSessionDomainService";

/**
 * Domain service for WebSocket connection business logic
 * @description Handles the core business rules for WebSocket connection events
 */
export class WebSocketConnectionDomainService {
  /**
   * Creates a new WebSocketConnectionDomainService instance
   * @param presenceDomainService - Domain service for presence operations
   * @param streamingSessionDomainService - Domain service for streaming session operations
   */
  constructor(
    private readonly presenceDomainService: PresenceDomainService,
    private readonly streamingSessionDomainService: StreamingSessionDomainService
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
      // 1. Set user online
      await this.presenceDomainService.setUserOnline(request.userId);
      
      // 2. Log connection
      console.log(`User ${request.userId} connected via WebSocket`);
      
      return WebSocketEventResponse.success(`User ${request.userId} connected successfully`);
    } catch (error: any) {
      console.error(`Failed to handle connection for user ${request.userId}:`, error);
      return WebSocketEventResponse.error(`Failed to handle connection: ${error.message}`);
    }
  }

  /**
   * Handles WebSocket disconnection event
   * @param request - The WebSocket event request
   * @returns Promise that resolves to the WebSocket event response
   * @example
   * const response = await webSocketConnectionDomainService.handleDisconnection(request);
   */
  async handleDisconnection(request: WebSocketEventRequest): Promise<WebSocketEventResponse> {
    try {
      // 1. Set user offline
      await this.presenceDomainService.setUserOffline(request.userId);
      
      // 2. Stop streaming session with DISCONNECT reason
      await this.streamingSessionDomainService.stopStreamingSession(request.userId, 'DISCONNECT');
      
      // 3. Log disconnection 
      console.log(`User ${request.userId} disconnected via WebSocket`);
      
      return WebSocketEventResponse.success(`User ${request.userId} disconnected successfully`);
    } catch (error: any) {
      console.error(`Failed to handle disconnection for user ${request.userId}:`, error);
      return WebSocketEventResponse.error(`Failed to handle disconnection: ${error.message}`);
    }
  }
}
