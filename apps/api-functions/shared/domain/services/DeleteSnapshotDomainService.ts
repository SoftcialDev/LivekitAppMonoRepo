/**
 * @fileoverview DeleteSnapshotDomainService - Domain service for snapshot deletion operations
 * @summary Handles snapshot deletion business logic
 * @description Contains the core business logic for deleting snapshot reports
 */

import { DeleteSnapshotRequest } from "../value-objects/DeleteSnapshotRequest";
import { DeleteSnapshotResponse } from "../value-objects/DeleteSnapshotResponse";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IBlobStorageService } from "../interfaces/IBlobStorageService";
import { ISnapshotRepository } from "../interfaces/ISnapshotRepository";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Domain service for snapshot deletion business logic
 * @description Handles the core business rules for deleting snapshot reports
 */
export class DeleteSnapshotDomainService {
  /**
   * Creates a new DeleteSnapshotDomainService instance
   * @param userRepository - Repository for user data access
   * @param blobStorageService - Service for blob storage operations
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly blobStorageService: IBlobStorageService,
    private readonly snapshotRepository: ISnapshotRepository
  ) {}

  /**
   * Deletes a snapshot report
   * @param request - The snapshot deletion request
   * @returns Promise that resolves to the deletion response
   * @throws UserNotFoundError when caller not found
   * @example
   * const response = await deleteSnapshotDomainService.deleteSnapshot(request);
   */
  async deleteSnapshot(request: DeleteSnapshotRequest): Promise<DeleteSnapshotResponse> {
    // 1. Find caller by Azure AD Object ID
    const caller = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!caller || caller.deletedAt) {
      throw new UserNotFoundError(`User with ID ${request.callerId} not found or deleted`);
    }

    // 2. Find snapshot by ID
    const snapshot = await this.snapshotRepository.findById(request.snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot with ID ${request.snapshotId} not found`);
    }

    // 3. Optionally delete blob from storage
    try {
      await this.blobStorageService.deleteImage(this.extractBlobNameFromUrl(snapshot.imageUrl));
    } catch (error) {
      // Log error but don't fail the deletion
      console.warn("Failed to delete blob from storage:", error);
    }

    // 4. Delete snapshot record from database
    await this.snapshotRepository.deleteById(request.snapshotId);

    return new DeleteSnapshotResponse(
      request.snapshotId,
      `Snapshot ${request.snapshotId} deleted successfully`
    );
  }


  /**
   * Extracts blob name from blob storage URL
   * @param imageUrl - The full URL of the image
   * @returns The blob name
   * @private
   */
  private extractBlobNameFromUrl(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1]; // Get the last part of the path
    } catch (error) {
      console.warn("Failed to extract blob name from URL:", imageUrl);
      return imageUrl; // Fallback to the full URL
    }
  }
}
