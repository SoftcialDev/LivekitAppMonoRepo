/**
 * @fileoverview DeleteRecordingApplicationService - Application service for recording deletion operations
 * @summary Orchestrates recording deletion with authorization and business logic
 * @description Handles authorization and coordinates domain services for recording deletion operations
 */

import { DeleteRecordingRequest } from "../../domain/value-objects/DeleteRecordingRequest";
import { DeleteRecordingResponse } from "../../domain/value-objects/DeleteRecordingResponse";
import { DeleteRecordingDomainService } from "../../domain/services/DeleteRecordingDomainService";
import { AuthorizationService } from "../../domain/services/AuthorizationService";

/**
 * Application service for handling recording deletion operations
 * @description Orchestrates authorization and domain services for recording deletion
 */
export class DeleteRecordingApplicationService {
  /**
   * Creates a new DeleteRecordingApplicationService instance
   * @param deleteRecordingDomainService - Domain service for recording deletion business logic
   * @param authorizationService - Service for handling authorization
   */
  constructor(
    private readonly deleteRecordingDomainService: DeleteRecordingDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Deletes a recording session with proper authorization
   * @param callerId - The ID of the user making the request
   * @param request - The delete recording request
   * @returns Promise that resolves to the deletion result
   * @throws RecordingAccessDeniedError when user lacks permission
   * @throws RecordingNotFoundError when recording is not found
   * @example
   * const result = await deleteRecordingApplicationService.deleteRecording(callerId, request);
   */
  async deleteRecording(callerId: string, request: DeleteRecordingRequest): Promise<DeleteRecordingResponse> {
    // Check authorization - only SuperAdmin can delete recordings
    await this.authorizationService.canAccessSuperAdmin(callerId);

    // Delegate to domain service for business logic
    return await this.deleteRecordingDomainService.deleteRecording(request);
  }
}
