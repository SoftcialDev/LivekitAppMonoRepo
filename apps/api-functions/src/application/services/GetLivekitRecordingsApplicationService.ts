/**
 * @fileoverview GetLivekitRecordingsApplicationService - Application service for recording operations
 * @summary Orchestrates recording session business operations
 * @description Handles authorization and coordinates domain services for recording session management
 */

import { IRecordingDomainService } from '../../domain/interfaces/IRecordingDomainService';
import { GetLivekitRecordingsRequest } from '../../domain/value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../../domain/value-objects/GetLivekitRecordingsResponse';

/**
 * Application service for GetLivekitRecordings operations
 * 
 * @param recordingDomainService - Domain service for recording operations
 */
export class GetLivekitRecordingsApplicationService {
  constructor(
    private readonly recordingDomainService: IRecordingDomainService
  ) {}

  /**
   * Fetches LiveKit recordings with authorization
   * @param callerId - Azure AD Object ID of the caller
   * @param request - Query parameters for listing recordings
   * @returns GetLivekitRecordingsResponse with recording data
   * @remarks Authorization is handled by the middleware requirePermission(Permission.RecordingsRead)
   */
  async getLivekitRecordings(callerId: string, request: GetLivekitRecordingsRequest): Promise<GetLivekitRecordingsResponse> {
    // Authorization is already handled by requirePermission middleware in the handler
    // No need for additional authorization check here
    return await this.recordingDomainService.listRecordings(request);
  }
}
