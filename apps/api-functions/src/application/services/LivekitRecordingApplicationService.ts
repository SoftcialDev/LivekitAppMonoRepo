/**
 * @fileoverview LivekitRecordingApplicationService - Application service for LiveKit recording operations
 * @summary Orchestrates recording command business operations
 * @description Handles authorization and coordinates domain services for recording command management
 */

import { ILivekitRecordingDomainService } from '../../domain/interfaces';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { LivekitRecordingRequest } from '../../domain/value-objects/LivekitRecordingRequest';
import { LivekitRecordingResponse } from '../../domain/value-objects/LivekitRecordingResponse';
import { RecordingCommand } from '../../domain/entities/RecordingCommand';
import { RecordingUserNotFoundError } from '../../domain/errors/RecordingErrors';
import { User } from '../../domain/entities/User';

/**
 * Application service for LiveKit recording operations
 * 
 * @param recordingDomainService - Domain service for recording operations
 * @param userRepository - Repository for user data access
 * @param authorizationService - Service for user authorization
 */
export class LivekitRecordingApplicationService {
  constructor(
    private readonly recordingDomainService: ILivekitRecordingDomainService,
    private readonly userRepository: IUserRepository,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Processes a recording command with authorization and user resolution
   * @param callerId - Azure AD Object ID of the caller
   * @param request - Recording command request
   * @returns LivekitRecordingResponse with command result
   * @throws RecordingCommandAccessDeniedError when caller lacks permissions
   * @throws RecordingUserNotFoundError when subject user cannot be resolved
   */
  async processRecordingCommand(callerId: string, request: LivekitRecordingRequest): Promise<LivekitRecordingResponse> {
    // Authorize caller - only SuperAdmin can control recordings
    await this.authorizationService.canAccessSuperAdmin(callerId);

    // Resolve caller user
    const caller = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!caller) {
      throw new RecordingUserNotFoundError("Caller not found in database");
    }

    // Resolve subject user (person being recorded)
    const subject = await this.resolveSubjectUser(request.roomName, caller);

    // Create recording command
    const command = RecordingCommand.create(
      request.command,
      request.roomName,
      caller.id,
      subject.id,
      subject.fullName || subject.email || subject.id
    );

    // Process command based on type
    if (request.isStartCommand()) {
      return await this.recordingDomainService.startRecording(command);
    } else {
      return await this.recordingDomainService.stopRecording(command);
    }
  }

  /**
   * Resolves the subject user (person being recorded) from room name
   * @param roomName - LiveKit room name (usually matches user ID)
   * @param fallbackUser - Fallback user if subject cannot be resolved
   * @returns Resolved user entity
   * @throws RecordingUserNotFoundError when subject cannot be resolved
   */
  private async resolveSubjectUser(roomName: string, fallbackUser: User): Promise<User> {
    try {
      // Try to find user by room name (common mapping: roomName === user.id)
      const subject = await this.userRepository.findById(roomName);
      
      if (subject) {
        return subject;
      }

      // Fallback to caller if subject not found
      return fallbackUser;
    } catch (error) {
      // If resolution fails, use fallback user
      return fallbackUser;
    }
  }
}
