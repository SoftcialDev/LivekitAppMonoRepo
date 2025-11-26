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
import { IChatService } from "../interfaces/IChatService";
import { IErrorLogService } from "../interfaces/IErrorLogService";
import { ImageUploadRequest } from "../value-objects/ImageUploadRequest";
import { UserNotFoundError } from "../errors/UserErrors";
import { formatCentralAmericaTime, getCentralAmericaTime } from "../../utils/dateUtils";

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

    // 3. Upload image to blob storage
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

    await this.notifySnapshotReport({
      psoName: pso.fullName ?? pso.email,
      psoEmail: pso.email,
      capturedBy: supervisor.fullName ?? supervisor.email,
      reason: request.reason,
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
      await this.chatService.sendMessageAsServiceAccount(chatId, {
        type: 'snapshotReport',
        subject: details.subject,
        psoName: details.psoName,
        psoEmail: details.psoEmail,
        capturedBy: details.capturedBy,
        capturedAt: details.capturedAt,
        reason: details.reason || 'Not provided',
        imageUrl: details.imageUrl
      });
      
    } catch (error: any) {
      console.error('[SendSnapshotDomainService] Failed to send snapshot notification', {
        message: error?.message,
        status: error?.status ?? error?.statusCode ?? error?.response?.status,
        body: error?.response?.data ?? error?.body ?? error?.value ?? null
      });

      try {
        await this.errorLogService.logChatServiceError({
          endpoint: 'SendSnapshot',
          functionName: 'notifySnapshotReport',
          error,
          userId: details.supervisorId,
          chatId,
          context: {
            psoEmail: details.psoEmail,
            snapshotId: details.snapshotId,
            psoName: details.psoName
          }
        });
      } catch (logError) {
        console.error('[ErrorLogService] Failed to persist error log', logError);
      }
    }
  }
}
