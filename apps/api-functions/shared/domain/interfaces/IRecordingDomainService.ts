/**
 * @fileoverview IRecordingDomainService - Interface for recording domain operations
 * @summary Defines contract for recording session business logic
 * @description Provides abstraction for recording domain service layer
 */

import { GetLivekitRecordingsRequest } from '../value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../value-objects/GetLivekitRecordingsResponse';

/**
 * Interface for recording domain service operations
 */
export interface IRecordingDomainService {
  /**
   * Lists recording sessions with UI-ready data
   * @param request - Query parameters for listing recordings
   * @returns GetLivekitRecordingsResponse with items and count
   */
  listRecordings(request: GetLivekitRecordingsRequest): Promise<GetLivekitRecordingsResponse>;
}
