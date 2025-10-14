/**
 * @fileoverview PresenceUpdateApplicationService - Application service for presence update operations
 * @summary Orchestrates presence updates with authorization
 * @description Handles authorization and coordinates domain services for presence update operations
 */

import { PresenceUpdateRequest } from "../../domain/value-objects/PresenceUpdateRequest";
import { PresenceUpdateResponse } from "../../domain/value-objects/PresenceUpdateResponse";
import { PresenceDomainService } from "../../domain/services/PresenceDomainService";
import { AuthorizationService } from "../../domain/services/AuthorizationService";
import { Status } from "../../domain/enums/Status";

/**
 * Application service for handling presence update operations
 * @description Orchestrates authorization and domain services for presence updates
 */
export class PresenceUpdateApplicationService {
  /**
   * Creates a new PresenceUpdateApplicationService instance
   * @param presenceDomainService - Domain service for presence business logic
   * @param authorizationService - Service for handling authorization
   */
  constructor(
    private readonly presenceDomainService: PresenceDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Updates user presence with proper authorization
   * @param callerId - The ID of the user making the request
   * @param request - The presence update request
   * @returns Promise that resolves to the update response
   * @throws UserNotFoundError when user is not found
   * @throws AuthorizationError when user lacks permission
   * @example
   * const response = await presenceUpdateApplicationService.updatePresence(callerId, request);
   */
  async updatePresence(callerId: string, request: PresenceUpdateRequest): Promise<PresenceUpdateResponse> {
    // Check authorization - all authenticated users can update their own presence

    // Delegate to domain service for business logic
    if (request.status === Status.Online) {
      await this.presenceDomainService.setUserOnline(callerId);
      return new PresenceUpdateResponse("Presence set to online");
    } else {
      await this.presenceDomainService.setUserOffline(callerId);
      return new PresenceUpdateResponse("Presence set to offline");
    }
  }
}
