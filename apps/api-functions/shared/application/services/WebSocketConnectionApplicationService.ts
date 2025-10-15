/**
 * @fileoverview WebSocketConnectionApplicationService - Application service for WebSocket connection operations
 * @summary Orchestrates WebSocket connection operations
 * @description Handles orchestration of domain services for WebSocket connection events
 */

import { WebSocketEventRequest } from "../../domain/value-objects/WebSocketEventRequest";
import { WebSocketEventResponse } from "../../domain/value-objects/WebSocketEventResponse";
import { WebSocketConnectionDomainService } from "../../domain/services/WebSocketConnectionDomainService";

/**
 * Application service for handling WebSocket connection operations
 * @description Orchestrates domain services for WebSocket connection events
 */
export class WebSocketConnectionApplicationService {
  /**
   * Creates a new WebSocketConnectionApplicationService instance
   * @param webSocketConnectionDomainService - Domain service for WebSocket connection business logic
   */
  constructor(
    private readonly webSocketConnectionDomainService: WebSocketConnectionDomainService
  ) {}

  /**
   * Handles WebSocket connection event
   * @param request - The WebSocket event request
   * @returns Promise that resolves to the WebSocket event response
   * @throws Error when connection handling fails
   * @example
   * const response = await webSocketConnectionApplicationService.handleConnection(request);
   */
  async handleConnection(request: WebSocketEventRequest): Promise<WebSocketEventResponse> {
    return await this.webSocketConnectionDomainService.handleConnection(request);
  }

  /**
   * Handles WebSocket disconnection event
   * @param request - The WebSocket event request
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves to the WebSocket event response
   * @throws Error when disconnection handling fails
   * @example
   * const response = await webSocketConnectionApplicationService.handleDisconnection(request, context);
   */
  async handleDisconnection(request: WebSocketEventRequest, context?: any): Promise<WebSocketEventResponse> {
    return await this.webSocketConnectionDomainService.handleDisconnection(request, context);
  }
}
