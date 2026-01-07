/**
 * @fileoverview GetSnapshotsDomainService - Domain service for snapshot retrieval operations
 * @summary Handles snapshot retrieval business logic
 * @description Contains the core business logic for retrieving snapshot reports
 */

import { GetSnapshotsRequest } from "../value-objects/GetSnapshotsRequest";
import { GetSnapshotsResponse } from "../value-objects/GetSnapshotsResponse";
import { SnapshotReport } from "../value-objects/SnapshotReport";
import { IUserRepository } from "../interfaces/IUserRepository";
import { ISnapshotRepository } from "../interfaces/ISnapshotRepository";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Domain service for snapshot retrieval business logic
 * @description Handles the core business rules for retrieving snapshot reports
 */
export class GetSnapshotsDomainService {
  /**
   * Creates a new GetSnapshotsDomainService instance
   * @param userRepository - Repository for user data access
   * @param snapshotRepository - Repository for snapshot data access
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly snapshotRepository: ISnapshotRepository
  ) {}

  /**
   * Retrieves all snapshot reports
   * @param request - The snapshot retrieval request
   * @returns Promise that resolves to the snapshot reports response
   * @throws UserNotFoundError when caller not found
   * @example
   * const response = await getSnapshotsDomainService.getSnapshots(request);
   */
  async getSnapshots(request: GetSnapshotsRequest): Promise<GetSnapshotsResponse> {
    // 1. Validate caller exists and is active
    const caller = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!caller || caller.deletedAt) {
      throw new UserNotFoundError(`User with ID ${request.callerId} not found or deleted`);
    }

    // 2. Fetch snapshots with relations
    const snapshots = await this.snapshotRepository.findAllWithRelations();

    // 3. Map to SnapshotReport DTOs
    const reports: SnapshotReport[] = snapshots.map(snapshot => ({
      id: snapshot.id,
      supervisorName: snapshot.supervisor.fullName,
      psoFullName: snapshot.pso.fullName,
      psoEmail: snapshot.pso.email,
      reason: {
        id: snapshot.reason.id,
        label: snapshot.reason.label,
        code: snapshot.reason.code
      },
      description: snapshot.description,
      imageUrl: snapshot.imageUrl,
      takenAt: snapshot.takenAt.toISOString(),
    }));

    return new GetSnapshotsResponse(reports);
  }
}
