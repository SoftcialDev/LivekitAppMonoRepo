/**
 * @fileoverview LiveKitTokenDomainService - Domain service for LiveKit token operations
 * @summary Handles business logic for LiveKit token generation
 * @description Encapsulates the business rules and operations for generating LiveKit tokens based on user roles
 */

import { LiveKitTokenRequest } from "../value-objects/LiveKitTokenRequest";
import { LiveKitTokenResponse } from "../value-objects/LiveKitTokenResponse";
import { LiveKitRoom } from "../entities/LiveKitRoom";
import { ILiveKitService } from "../interfaces/ILiveKitService";
import { IUserRepository } from "../interfaces/IUserRepository";
import { config } from '../../config';
import { UserNotFoundError } from "../errors/UserErrors";
import { UserRole } from "../enums/UserRole";

/**
 * Domain service for handling LiveKit token operations
 * @description Encapsulates business logic for generating LiveKit tokens based on user roles and permissions
 */
export class LiveKitTokenDomainService {
  /**
   * Creates a new LiveKitTokenDomainService instance
   * @param liveKitService - Service for LiveKit operations
   * @param userRepository - Repository for user data access
   * @param configService - Service for configuration access
   */
  constructor(
    private readonly liveKitService: ILiveKitService,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Generates LiveKit tokens for a user based on their role and permissions
   * @param request - The LiveKit token request containing caller and target user info
   * @returns Promise that resolves to the token response
   * @throws UserNotFoundError when the caller is not found
   * @example
   * const response = await liveKitTokenDomainService.generateTokenForUser(request);
   */
  async generateTokenForUser(request: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {
    // 1. Get caller information
    const caller = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!caller) {
      throw new UserNotFoundError(`User with ID ${request.callerId} not found`);
    }

    // 2. Determine if caller is admin or supervisor
    const isAdminOrSup = this.isAdminOrSupervisor(caller.role);

    // 3. Ensure caller's personal room exists
    await this.liveKitService.ensureRoom(caller.id);

    // 4. Determine which rooms to return based on role and target
    const roomNames = await this.determineRoomAccess(caller.id, isAdminOrSup, request.targetUserId);

    // 5. Generate tokens for each room
    const roomsWithTokens = await Promise.all(
      roomNames.map(async (roomName) => {
        const token = await this.liveKitService.generateToken(caller.id, isAdminOrSup, roomName);
        return new LiveKitRoom(roomName, token);
      })
    );

    // 6. Return response
    return new LiveKitTokenResponse(
      roomsWithTokens.map(room => room.toPayload()),
      config.livekitApiUrl
    );
  }

  /**
   * Determines if a user role is admin or supervisor
   * @param role - The user's role
   * @returns True if the user is admin or supervisor
   * @private
   */
  private isAdminOrSupervisor(role: string): boolean {
    return role === UserRole.Admin || role === UserRole.Supervisor || role === UserRole.SuperAdmin;
  }

  /**
   * Determines which rooms a user can access based on their role and target
   * @param callerId - The ID of the caller
   * @param isAdminOrSup - Whether the caller is admin or supervisor
   * @param targetUserId - Optional target user ID
   * @returns Promise that resolves to array of room names
   * @private
   */
  private async determineRoomAccess(
    callerId: string,
    isAdminOrSup: boolean,
    targetUserId?: string
  ): Promise<string[]> {
    if (!isAdminOrSup) {
      // Employee always gets their own room
      return [callerId];
    }

    if (targetUserId) {
      // Admin/Supervisor with specific target user
      return [targetUserId];
    }

    // Admin/Supervisor gets all other rooms (excluding their own)
    const allRooms = await this.liveKitService.listRooms();
    return allRooms.filter(room => room !== callerId);
  }

}
