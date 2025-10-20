/**
 * @fileoverview SendSnapshotDomainService - Domain service for snapshot report operations
 * @summary Handles snapshot report business logic
 * @description Contains the core business logic for sending snapshot reports
 */

import { SendSnapshotRequest } from "../value-objects/SendSnapshotRequest";
import { SendSnapshotResponse } from "../value-objects/SendSnapshotResponse";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IBlobStorageService } from "../interfaces/IBlobStorageService";
import { ISnapshotRepository } from "../interfaces/ISnapshotRepository";
import { ImageUploadRequest } from "../value-objects/ImageUploadRequest";
import { UserNotFoundError } from "../errors/UserErrors";
import { getCentralAmericaTime } from "../../utils/dateUtils";
import { randomUUID } from "crypto";

/**
 * Domain service for snapshot report business logic
 * @description Handles the core business rules for sending snapshot reports
 */
export class SendSnapshotDomainService {
  /**
   * Creates a new SendSnapshotDomainService instance
   * @param userRepository - Repository for user data access
   * @param blobStorageService - Service for blob storage operations
   * @param snapshotRepository - Repository for snapshot data access
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly blobStorageService: IBlobStorageService,
    private readonly snapshotRepository: ISnapshotRepository
  ) {}

  /**
   * Sends a snapshot report for a PSO
   * @param request - The snapshot report request
   * @param supervisorName - The name of the supervisor sending the report
   * @param token - Authentication token for chat notifications
   * @returns Promise that resolves to the snapshot report response
   * @throws UserNotFoundError when supervisor or PSO not found
   * @example
   * const response = await sendSnapshotDomainService.sendSnapshot(request, supervisorName, token);
   */
  async sendSnapshot(
    request: SendSnapshotRequest,
    supervisorName: string,
    token: string
  ): Promise<SendSnapshotResponse> {
    // 1. Find supervisor by Azure AD Object ID
    const supervisor = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!supervisor || supervisor.deletedAt) {
      throw new UserNotFoundError(`Supervisor with ID ${request.callerId} not found or deleted`);
    }

    // 2. Find PSO by email
    const pso = await this.userRepository.findByEmail(request.psoEmail.toLowerCase());
    if (!pso || pso.deletedAt) {
      throw new UserNotFoundError(`PSO with email ${request.psoEmail} not found or deleted`);
    }

    // 3. Upload image to blob storage
    const imageBuffer = Buffer.from(request.imageBase64, "base64");
    const datePath = getCentralAmericaTime().toISOString().slice(0, 10);
    const filename = `${datePath}/${randomUUID()}.jpg`;
    
    const imageUploadRequest = new ImageUploadRequest(
      request.imageBase64,
      supervisor.id
    );
    
    const imageUrl = await this.blobStorageService.uploadImage(imageUploadRequest);

    // 4. Persist snapshot record
    const snapshot = await this.snapshotRepository.create(
      supervisor.id,
      pso.id,
      request.reason,
      imageUrl
    );


    return new SendSnapshotResponse(
      snapshot.id,
      `Snapshot report sent successfully for PSO ${pso.email}`
    );
  }


}
