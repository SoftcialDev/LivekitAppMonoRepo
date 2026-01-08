/**
 * @fileoverview GetActiveTalkSessionDomainService - Domain service for getting active talk session
 * @summary Handles business logic for retrieving active talk session information
 * @description Encapsulates the business rules and operations for checking active talk sessions
 */

import { ITalkSessionRepository } from '../interfaces/ITalkSessionRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { GetActiveTalkSessionRequest } from '../value-objects/GetActiveTalkSessionRequest';
import { GetActiveTalkSessionResponse } from '../value-objects/GetActiveTalkSessionResponse';
import { UserNotFoundError } from '../errors/UserErrors';

/**
 * Domain service for handling get active talk session operations
 * @description Encapsulates business logic for checking active talk sessions
 */
export class GetActiveTalkSessionDomainService {
  /**
   * Creates a new GetActiveTalkSessionDomainService instance
   * @param talkSessionRepository - Repository for talk session data access
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly talkSessionRepository: ITalkSessionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Gets active talk session information for a PSO
   * @param request - The get active talk session request
   * @returns Promise that resolves to the get active talk session response
   * @throws UserNotFoundError when PSO is not found
   */
  async getActiveTalkSession(request: GetActiveTalkSessionRequest): Promise<GetActiveTalkSessionResponse> {
    const pso = await this.findUserByEmail(request.psoEmail);

    // Get active sessions for this PSO
    const activeSessions = await this.talkSessionRepository.getActiveTalkSessionsForPso(pso.id);

    if (activeSessions.length === 0) {
      return GetActiveTalkSessionResponse.fromSession(null);
    }

    // Get the most recent active session
    const activeSession = activeSessions[0];

    // Get supervisor information
    const supervisor = await this.userRepository.findById(activeSession.supervisorId);
    const supervisorEmail = supervisor?.email;
    const supervisorName = supervisor?.fullName || undefined;

    return GetActiveTalkSessionResponse.fromSession(activeSession, supervisorEmail, supervisorName);
  }

  /**
   * Finds a user by email
   * @param email - The email to search for
   * @returns Promise that resolves to the user
   * @throws UserNotFoundError when the user is not found
   * @private
   */
  private async findUserByEmail(email: string): Promise<{ id: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundError(`User not found for email: ${email}`);
    }

    return {
      id: user.id
    };
  }
}

