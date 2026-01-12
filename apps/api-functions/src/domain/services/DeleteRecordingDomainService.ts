/**
 * @fileoverview DeleteRecordingDomainService - Domain service for recording deletion operations
 * @summary Handles business logic for deleting recording sessions
 * @description Encapsulates the business rules and operations for deleting recording sessions including blob and database cleanup
 */

import { DeleteRecordingRequest } from "../value-objects/DeleteRecordingRequest";
import { DeleteRecordingResponse } from "../value-objects/DeleteRecordingResponse";
import { IRecordingSessionRepository } from "../interfaces/IRecordingSessionRepository";
import { IBlobStorageService } from "../interfaces/IBlobStorageService";
import { RecordingNotFoundError } from "../errors/RecordingErrors";

/**
 * Domain service for handling recording deletion operations
 * @description Encapsulates business logic for deleting recording sessions
 */
export class DeleteRecordingDomainService {
  /**
   * Creates a new DeleteRecordingDomainService instance
   * @param recordingRepository - Repository for recording session data access
   * @param blobStorageService - Service for blob storage operations
   */
  constructor(
    private readonly recordingRepository: IRecordingSessionRepository,
    private readonly blobStorageService: IBlobStorageService
  ) {}

  /**
   * Deletes a recording session by ID
   * @param request - The delete recording request containing the session ID
   * @returns Promise that resolves to the deletion result
   * @throws RecordingNotFoundError when the recording session is not found
   * @example
   * const result = await deleteRecordingDomainService.deleteRecording(request);
   */
  async deleteRecording(request: DeleteRecordingRequest): Promise<DeleteRecordingResponse> {
    // 1. Find the recording session
    const session = await this.recordingRepository.findById(request.id);
    if (!session) {
      throw new RecordingNotFoundError(`Recording session with ID ${request.id} not found`);
    }

    // 2. Extract blob path from session
    const blobPath = this.extractBlobPath(session);

    // 3. Delete blob if path exists
    let blobDeleted = false;
    let blobMissing = false;

    if (blobPath) {
      try {
        blobDeleted = await this.blobStorageService.deleteRecordingByPath(blobPath);
        blobMissing = !blobDeleted;
      } catch {
        // If blob deletion fails, mark as missing but continue with DB deletion
        // Error is intentionally ignored as we want to continue with DB deletion
        blobMissing = true;
      }
    } else {
      blobMissing = true;
    }

    // 4. Delete database record
    await this.recordingRepository.deleteById(request.id);

    // 5. Return result
    return new DeleteRecordingResponse(
      "Recording deleted successfully",
      request.id,
      blobPath,
      blobDeleted,
      blobMissing,
      true // dbDeleted is always true if we reach this point
    );
  }

  /**
   * Extracts blob path from recording session
   * @param session - The recording session object
   * @returns The blob path or null if not found
   * @private
   */
  private extractBlobPath(session: any): string | null {
    // Try to get blobPath from session object first
    if (session.blobPath) {
      return session.blobPath;
    }

    // Try to parse from blobUrl if available
    if (session.blobUrl) {
      return this.tryParseBlobPathFromUrl(session.blobUrl);
    }

    return null;
  }

  /**
   * Attempts to derive the relative blob path from a full Azure Blob URL
   * @param url - Absolute blob URL
   * @returns Relative blob path or null if it cannot be parsed safely
   * @private
   */
  private tryParseBlobPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Look for container name and extract path after it
      const containerIndex = pathParts.indexOf('recordings');
      if (containerIndex !== -1 && containerIndex < pathParts.length - 1) {
        return pathParts.slice(containerIndex + 1).join('/');
      }
      
      return null;
    } catch {
      return null;
    }
  }
}
