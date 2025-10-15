/**
 * @fileoverview ContactManagerDisconnectApplicationService - Application service for Contact Manager disconnect operations
 * @summary Orchestrates Contact Manager disconnect operations
 * @description Handles orchestration of domain services for Contact Manager disconnection events
 */

import { WebSocketEventRequest } from "../../domain/value-objects/WebSocketEventRequest";
import { WebSocketEventResponse } from "../../domain/value-objects/WebSocketEventResponse";
import { ContactManagerDisconnectDomainService } from "../../domain/services/ContactManagerDisconnectDomainService";
import { PresenceDomainService } from "../../domain/services/PresenceDomainService";
import { IWebPubSubService } from "../../domain/interfaces/IWebPubSubService";

/**
 * Application service for handling Contact Manager disconnect operations
 * @description Orchestrates domain services for Contact Manager disconnection events
 */
export class ContactManagerDisconnectApplicationService {
  /**
   * Creates a new ContactManagerDisconnectApplicationService instance
   * @param contactManagerDisconnectDomainService - Domain service for Contact Manager disconnect business logic
   * @param presenceDomainService - Domain service for presence operations
   * @param webPubSubService - Service for WebPubSub operations
   */
  constructor(
    private readonly contactManagerDisconnectDomainService: ContactManagerDisconnectDomainService,
    private readonly presenceDomainService: PresenceDomainService,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Handles Contact Manager disconnection event
   * @param request - The WebSocket event request
   * @returns Promise that resolves to the WebSocket event response
   * @throws Error when Contact Manager disconnect handling fails
   * @example
   * const response = await contactManagerDisconnectApplicationService.handleContactManagerDisconnect(request);
   */
  async handleContactManagerDisconnect(request: WebSocketEventRequest): Promise<WebSocketEventResponse> {
    return await this.contactManagerDisconnectDomainService.handleContactManagerDisconnect(request);
  }
}
