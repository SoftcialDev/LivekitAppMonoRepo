/**
 * @fileoverview GetLivekitRecordingsApplicationService - Application service for recording operations
 * @summary Orchestrates recording session business operations
 * @description Handles authorization and coordinates domain services for recording session management
 */

import { IRecordingDomainService } from '../../domain/interfaces/IRecordingDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { GetLivekitRecordingsRequest } from '../../domain/value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../../domain/value-objects/GetLivekitRecordingsResponse';
import { RecordingAccessDeniedError } from '../../domain/errors/RecordingErrors';

/**
 * Application service for GetLivekitRecordings operations
 * 
 * @param recordingDomainService - Domain service for recording operations
 * @param authorizationService - Service for user authorization
 */
export class GetLivekitRecordingsApplicationService {
  constructor(
    private readonly recordingDomainService: IRecordingDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Fetches LiveKit recordings with authorization
   * @param callerId - Azure AD Object ID of the caller
   * @param request - Query parameters for listing recordings
   * @returns GetLivekitRecordingsResponse with recording data
   * @throws RecordingAccessDeniedError when caller lacks permissions
   */
  async getLivekitRecordings(callerId: string, request: GetLivekitRecordingsRequest): Promise<GetLivekitRecordingsResponse> {
    // Authorize caller - only Admin and SuperAdmin can access recordings
    const isAuthorized = await this.authorizationService.canAccessAdmin(callerId);
    
    if (!isAuthorized) {
      throw new RecordingAccessDeniedError("Insufficient privileges to access recordings");
    }

    return await this.recordingDomainService.listRecordings(request);
  }
}
