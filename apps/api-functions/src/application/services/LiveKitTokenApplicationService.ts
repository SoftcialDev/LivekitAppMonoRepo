/**
 * @fileoverview LiveKitTokenApplicationService - Application service for LiveKit token operations
 * @summary Orchestrates LiveKit token generation with authorization
 * @description Handles authorization and coordinates domain services for LiveKit token operations
 */

import { LiveKitTokenRequest } from '../../domain/value-objects/LiveKitTokenRequest';
import { LiveKitTokenResponse } from '../../domain/value-objects/LiveKitTokenResponse';
import { LiveKitTokenDomainService } from '../../domain/services/LiveKitTokenDomainService';

/**
 * Application service for handling LiveKit token operations
 * @description Orchestrates authorization and domain services for LiveKit token generation
 */
export class LiveKitTokenApplicationService {
  /**
   * Creates a new LiveKitTokenApplicationService instance
   * @param liveKitTokenDomainService - Domain service for LiveKit token business logic
   */
  constructor(
    private readonly liveKitTokenDomainService: LiveKitTokenDomainService
  ) {}

  /**
   * Generates LiveKit tokens with proper authorization
   * @param callerId - The ID of the user making the request
   * @param request - The LiveKit token request
   * @returns Promise that resolves to the token response
   * @throws UserNotFoundError when user is not found
   * @throws AuthorizationError when user lacks permission
   * @example
   * const response = await liveKitTokenApplicationService.generateToken(callerId, request);
   */
  async generateToken(callerId: string, request: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {

    return await this.liveKitTokenDomainService.generateTokenForUser(request);
  }
}
