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
import { getCentralAmericaTimeISO } from "../../utils/dateUtils";

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
      
      console.log(`🔌 [CONNECT] Starting connection process for user: ${request.userId}`);
      
      // 1. Set user online
      console.log(`🔌 [CONNECT] Setting user online: ${request.userId}`);
      await this.presenceDomainService.setUserOnline(request.userId);
      console.log(`🔌 [CONNECT] User set online successfully`);
      console.log(`🔌 [CONNECT] User ${request.userId} connected (phase=${request.phase})`);

      // 2. Optional: light reconciliation on connect (cheap)
      console.log(`🔄 [SYNC] Starting light sync on connect...`);
      try {
        const res = await this.webPubSubService.syncAllUsersWithDatabase();
        console.log(`🔄 [SYNC] Light sync completed: ${res.corrected} corrections, ${res.warnings.length} warnings, ${res.errors.length} errors`);
      } catch (e: any) {
        console.error(`🔄 [SYNC] Light sync on connect failed:`, e?.message ?? e);
        console.error(`🔄 [SYNC] Light sync error stack:`, e?.stack);
      }

      console.log(`🔌 [CONNECT] Connection process completed for user: ${request.userId}`);
      return WebSocketEventResponse.success(`User ${request.userId} connected successfully`);
    } catch (error: any) {
      console.error(`🔌 [CONNECT] Failed to handle connection for user ${request.userId}:`, error);
      console.error(`🔌 [CONNECT] Error stack:`, error.stack);
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

      const log = context?.log || console.log;
      log(`🔌 [DISCONNECT] Starting disconnection process for user: ${request.userId}`);

      // 1. Set user offline
      log(`🔌 [DISCONNECT] Setting user offline: ${request.userId}`);
      await this.presenceDomainService.setUserOffline(request.userId, context);
      log(`🔌 [DISCONNECT] User set offline successfully`);
      
      // 2. Stop streaming session with DISCONNECT reason
      console.log(`🔌 [DISCONNECT] Stopping streaming session for: ${request.userId}`);
      console.log(`🕐 [WebSocketConnectionDomainService] handleDisconnection timestamp:`, {
        userId: request.userId,
        phase: request.phase,
        timestamp: getCentralAmericaTimeISO()
      });
      await this.streamingSessionDomainService.stopStreamingSession(request.userId, 'DISCONNECT', context);
      console.log(`🔌 [DISCONNECT] Streaming session stopped successfully`);
      
      // 3. Log disconnection 
      console.log(`🔌 [DISCONNECT] User ${request.userId} disconnected (phase=${request.phase})`);

      // 4. Do the full reconciliation here (authoritative cleanup)
      console.log(`🔄 [SYNC] Starting full sync after disconnection...`);
      try {
        const res = await this.webPubSubService.syncAllUsersWithDatabase();
        console.log(`🔄 [SYNC] Full sync completed: ${res.corrected} corrections, ${res.warnings.length} warnings, ${res.errors.length} errors`);
        
        if (res.corrected > 0) {
          console.log(`🔄 [SYNC] Corrections made:`, res);
        }
        if (res.warnings.length > 0) {
          console.log(`🔄 [SYNC] Warnings:`, res.warnings);
        }
        if (res.errors.length > 0) {
          console.log(`🔄 [SYNC] Errors:`, res.errors);
        }
      } catch (e: any) {
        console.error(`🔄 [SYNC] Full sync failed:`, e?.message ?? e);
        console.error(`🔄 [SYNC] Full sync error stack:`, e?.stack);
      }
      
      console.log(`🔌 [DISCONNECT] Disconnection process completed for user: ${request.userId}`);
      return WebSocketEventResponse.success(`User ${request.userId} disconnected successfully`);
    } catch (error: any) {
      console.error(`🔌 [DISCONNECT] Failed to handle disconnection for user ${request.userId}:`, error);
      console.error(`🔌 [DISCONNECT] Error stack:`, error.stack);
      return WebSocketEventResponse.error(`Failed to handle disconnection: ${error.message}`);
    }
  }
}
