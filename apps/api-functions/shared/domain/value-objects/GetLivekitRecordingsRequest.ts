/**
 * @fileoverview GetLivekitRecordingsRequest - Value Object for GetLivekitRecordings requests
 * @summary Encapsulates query parameters for fetching LiveKit recordings
 * @description Provides structured access to recording query parameters with validation
 */

import { GetLivekitRecordingsRequestPayload } from '../schemas/GetLivekitRecordingsSchema';

/**
 * Value Object for GetLivekitRecordings request parameters
 * 
 * @param roomName - Optional room name filter for recordings
 * @param limit - Maximum number of recordings to return (1-200)
 * @param order - Sort order for recordings (ascending or descending)
 * @param includeSas - Whether to include SAS URLs for secure playback
 * @param sasMinutes - SAS URL validity duration in minutes
 */
export class GetLivekitRecordingsRequest {
  constructor(
    public readonly roomName?: string,
    public readonly limit: number = 1000,
    public readonly order: "asc" | "desc" = "desc",
    public readonly includeSas: boolean = true,
    public readonly sasMinutes: number = 60
  ) {}

  /**
   * Creates a GetLivekitRecordingsRequest from validated query parameters
   * @param payload - Validated query parameters from Zod schema
   * @returns GetLivekitRecordingsRequest instance
   */
  static fromQuery(payload: GetLivekitRecordingsRequestPayload): GetLivekitRecordingsRequest {
    return new GetLivekitRecordingsRequest(
      payload.roomName,
      payload.limit,
      payload.order,
      payload.includeSas,
      payload.sasMinutes
    );
  }
}
