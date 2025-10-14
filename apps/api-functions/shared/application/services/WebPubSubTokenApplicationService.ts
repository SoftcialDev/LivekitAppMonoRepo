/**
 * @fileoverview WebPubSubTokenApplicationService - Application service for WebPubSub token operations
 * @summary Orchestrates WebPubSub token generation
 * @description Handles orchestration of domain services for WebPubSub token generation operations
 */

import { WebPubSubTokenRequest } from "../../domain/value-objects/WebPubSubTokenRequest";
import { WebPubSubTokenResponse } from "../../domain/value-objects/WebPubSubTokenResponse";
import { WebPubSubTokenDomainService } from "../../domain/services/WebPubSubTokenDomainService";
import { AuthorizationService } from "../../domain/services/AuthorizationService";

/**
 * Application service for handling WebPubSub token generation operations
 * @description Orchestrates domain services for WebPubSub token generation
 */
export class WebPubSubTokenApplicationService {
  /**
   * Creates a new WebPubSubTokenApplicationService instance
   * @param webPubSubTokenDomainService - Domain service for WebPubSub token business logic
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly webPubSubTokenDomainService: WebPubSubTokenDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Generates a WebPubSub token for a user
   * @param callerId - The ID of the user making the request
   * @param request - The WebPubSub token request
   * @returns Promise that resolves to the WebPubSub token response
   * @throws UserNotFoundError when user is not found
   * @example
   * const response = await webPubSubTokenApplicationService.generateToken(callerId, request);
   */
  async generateToken(callerId: string, request: WebPubSubTokenRequest): Promise<WebPubSubTokenResponse> {
    // All authenticated users can generate WebPubSub tokens
    // No specific authorization needed as domain service handles user lookup
    return await this.webPubSubTokenDomainService.generateTokenForUser(request);
  }
}
