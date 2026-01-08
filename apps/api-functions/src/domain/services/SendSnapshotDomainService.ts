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
import { ISnapshotReasonRepository } from "../interfaces/ISnapshotReasonRepository";
import { IChatService } from "../interfaces/IChatService";
import { IErrorLogService } from "../interfaces/IErrorLogService";
import { ImageUploadRequest } from "../value-objects/ImageUploadRequest";
import { UserNotFoundError } from "../errors/UserErrors";
import { SnapshotReasonNotFoundError, SnapshotReasonInactiveError, DescriptionRequiredError } from "../errors/SnapshotErrors";
import { formatCentralAmericaTime, getCentralAmericaTime } from '../../utils/dateUtils';
import { extractErrorMessage } from '../../utils/error/ErrorHelpers';
import { randomUUID } from 'crypto';

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
   * @param chatService - Service for chat operations
   * @param errorLogService - Service for error logging operations
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly blobStorageService: IBlobStorageService,
    private readonly snapshotRepository: ISnapshotRepository,
    private readonly snapshotReasonRepository: ISnapshotReasonRepository,
    private readonly chatService: IChatService,
    private readonly errorLogService: IErrorLogService
  ) {}

  /**
   * Processes a snapshot report request and notifies stakeholders.
   *
   * @param request - Snapshot request containing PSO email, reason, image and caller metadata.
   * @returns Snapshot response with the stored snapshot identifier.
   * @throws UserNotFoundError when the supervisor (caller) or the PSO cannot be located or are soft-deleted.
   */
  async sendSnapshot(request: SendSnapshotRequest): Promise<SendSnapshotResponse> {
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

    // 3. Validate snapshot reason exists and is active
    const reason = await this.snapshotReasonRepository.findById(request.reasonId);
    if (!reason) {
      throw new SnapshotReasonNotFoundError(`Snapshot reason with ID ${request.reasonId} not found`);
    }
    if (!reason.isActive) {
      throw new SnapshotReasonInactiveError(`Snapshot reason with ID ${request.reasonId} is inactive`);
    }

    // Validate description for "OTHER" reason
    if (reason.code === 'OTHER' && (!request.description || request.description.trim().length === 0)) {
      throw new DescriptionRequiredError();
    }

    // 4. Generate a temporary UUID for the snapshot to use in file naming
    // This allows us to create descriptive file names before the snapshot is persisted
    const temporarySnapshotId = randomUUID();

    // 5. Upload image to blob storage with descriptive file name
    const psoName = pso.fullName ?? pso.email.split('@')[0];
    const imageUploadRequest = new ImageUploadRequest(
      request.imageBase64,
      supervisor.id,
      psoName,
      reason.code,
      temporarySnapshotId
    );
    
    const imageUrl = await this.blobStorageService.uploadImage(imageUploadRequest);

    // 6. Persist snapshot record with the actual image URL using the same ID for consistency
    const snapshot = await this.snapshotRepository.create(
      supervisor.id,
      pso.id,
      request.reasonId,
      request.description,
      imageUrl,
      temporarySnapshotId
    );

    await this.notifySnapshotReport({
      psoName: pso.fullName ?? pso.email,
      psoEmail: pso.email,
      capturedBy: supervisor.fullName ?? supervisor.email,
      reason: reason.label,
      imageUrl,
      capturedAt: formatCentralAmericaTime(getCentralAmericaTime()),
      subject: `Snapshot Report – ${pso.fullName ?? pso.email}`,
      supervisorId: supervisor.id,
      snapshotId: snapshot.id
    });

    return new SendSnapshotResponse(
      snapshot.id,
      `Snapshot report sent successfully for PSO ${pso.email}`
    );
  }

  /**
   * Emits a snapshot notification to the Snapshot Reports Teams chat using the service account.
   * Errors are logged but do not prevent the main flow from succeeding.
   *
   * @param details - Structured snapshot notification payload.
   */
  private async notifySnapshotReport(details: {
    /** Friendly PSO name shown in the notification card. */
    psoName: string;
    /** PSO email address used for routing/audit purposes. */
    psoEmail: string;
    /** Supervisor name who captured the snapshot. */
    capturedBy: string;
    /** Reason provided for the snapshot. */
    reason: string;
    /** LiveKit or blob storage URL of the snapshot image. */
    imageUrl: string;
    /** Timestamp (Central time) when the snapshot was captured. */
    capturedAt: string;
    /** Notification subject/title shown in Teams. */
    subject: string;
    /** Supervisor identifier for error logging. */
    supervisorId: string;
    /** Snapshot identifier for error logging. */
    snapshotId: string;
  }): Promise<void> {
    let chatId: string | undefined;
    try {
      chatId = await this.chatService.getSnapshotReportsChatId();
      await this.chatService.sendMessageAsApp(chatId, {
        type: 'snapshotReport',
        subject: details.subject,
        psoName: details.psoName,
        psoEmail: details.psoEmail,
        capturedBy: details.capturedBy,
        capturedAt: details.capturedAt,
        reason: details.reason || 'Not provided',
        imageUrl: details.imageUrl
      });
      
    } catch (error: unknown) {
      try {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        await this.errorLogService.logChatServiceError({
          endpoint: 'SendSnapshot',
          functionName: 'notifySnapshotReport',
          error: errorInstance,
          userId: details.supervisorId,
          chatId,
          context: {
            psoEmail: details.psoEmail,
            snapshotId: details.snapshotId,
            psoName: details.psoName
          }
        });
      } catch {
        // Failed to persist error log
      }
    }
  }
}
