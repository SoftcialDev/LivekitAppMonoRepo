/**
 * @fileoverview WebPubSubTokenDomainService - Domain service for WebPubSub token generation
 * @summary Handles WebPubSub token business logic
 * @description Contains the core business logic for generating WebPubSub tokens based on user roles
 */

import { WebPubSubTokenRequest } from "../value-objects/WebPubSubTokenRequest";
import { WebPubSubTokenResponse } from "../value-objects/WebPubSubTokenResponse";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IWebPubSubService } from "../interfaces/IWebPubSubService";
import { config } from '../../config';
import { UserNotFoundError } from "../errors/UserErrors";
import { UserRole } from "../enums/UserRole";
import { WebPubSubGroups } from "../constants/WebPubSubGroups";

/**
 * Domain service for WebPubSub token generation business logic
 * @description Handles the core business rules for token generation based on user roles
 */
export class WebPubSubTokenDomainService {
  /**
   * Creates a new WebPubSubTokenDomainService instance
   * @param userRepository - Repository for user data access
   * @param webPubSubService - Service for WebPubSub operations
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Generates a WebPubSub token for a user based on their role
   * @param request - The WebPubSub token request
   * @returns Promise that resolves to the WebPubSub token response
   * @throws UserNotFoundError when user is not found or deleted
   * @example
   * const response = await webPubSubTokenDomainService.generateTokenForUser(request);
   */
  async generateTokenForUser(request: WebPubSubTokenRequest): Promise<WebPubSubTokenResponse> {
    // Find user by Azure AD Object ID
    const user = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!user || user.deletedAt) {
      throw new UserNotFoundError(`User with ID ${request.callerId} not found or deleted`);
    }

    // Determine groups based on user role
    const groups = this.determineUserGroups(user.role, user.email);

    // Generate token using WebPubSub service
    const token = await this.webPubSubService.generateToken(user.email, groups);

    // Get configuration values
    const endpoint = config.webPubSubEndpoint;
    const hubName = config.webPubSubHubName;

    return new WebPubSubTokenResponse(token, endpoint, hubName, groups);
  }

  /**
   * Determines the groups a user should be subscribed to based on their role
   * @param role - The user's role
   * @param email - The user's email address
   * @returns Array of group names the user should join
   * @private
   */
  private determineUserGroups(role: string, email: string): string[] {
    const normalizedEmail = email.trim().toLowerCase();
    const groups: string[] = [WebPubSubGroups.PRESENCE]; // All users get presence group

    // PSOs get additional groups for commands and status updates
    if (role === UserRole.PSO) {
      groups.unshift(normalizedEmail); // Personal group for commands
      groups.push(WebPubSubGroups.CM_STATUS_UPDATES); // Contact Manager status updates
    }

    // Admins, Supervisors, ContactManagers, SuperAdmins remain on presence group only
    return groups;
  }
}
