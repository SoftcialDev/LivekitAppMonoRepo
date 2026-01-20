import { ICameraFailureService } from '../../domain/interfaces/ICameraFailureService';
import { CameraStartFailureRequest } from '../../domain/schemas/CameraStartFailureSchema';
import { ICameraStartFailureRepository } from '../../domain/interfaces/ICameraStartFailureRepository';
import { IPendingCommandRepository } from '../../domain/interfaces/IPendingCommandRepository';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { CameraFailureReport } from '../../domain/value-objects/CameraFailureReport';
import { CreateCameraStartFailureData } from '../../domain/types/CameraFailureTypes';
import { getFriendlyErrorMessage } from '../../domain/utils/ErrorMessageMapper';

/**
 * Application service implementing camera start failure logging.
 * Also notifies the command initiator when a failure occurs.
 */
export class CameraFailureApplicationService implements ICameraFailureService {
  constructor(
    private readonly repo: ICameraStartFailureRepository,
    private readonly pendingCommandRepository: IPendingCommandRepository,
    private readonly webPubSubService: IWebPubSubService,
    private readonly userRepository: IUserRepository
  ) {}

  async logStartFailure(
    input: CameraStartFailureRequest & { userAdId: string; userEmail?: string }
  ): Promise<void> {
    const report = CameraFailureReport.fromRequest(input);
    const persistenceData = report.toPersistence() as unknown as CreateCameraStartFailureData;
    
    // Save the failure to database
    await this.repo.create(persistenceData);

    // Notify the initiator using the email from the report
    await this.notifyCommandInitiatorIfExists(
      input.userAdId,
      report.initiatedByEmail,
      report.stage,
      report.errorMessage || null,
      report.errorName || null
    );
  }

  /**
   * Notifies the user who initiated a START command if the email is available
   * @param psoAdId - Azure AD Object ID of the PSO who reported the failure
   * @param initiatedByEmail - Email of the user who initiated the START command
   * @param stage - The failure stage
   * @param errorMessage - Technical error message
   * @param errorName - Technical error name
   * @private
   */
  private async notifyCommandInitiatorIfExists(
    psoAdId: string,
    initiatedByEmail: string | undefined,
    stage: string,
    errorMessage: string | null,
    errorName: string | null
  ): Promise<void> {
    try {
      // Skip notification if no initiator email provided
      if (!initiatedByEmail) {
        return;
      }

      // Find PSO user to get their email and name
      const psoUser = await this.userRepository.findByAzureAdObjectId(psoAdId);
      if (!psoUser) {
        return; // PSO not found, skip notification
      }

      // Get friendly error message
      const friendlyMessage = getFriendlyErrorMessage(
        stage as any,
        errorMessage,
        errorName
      );

      // Send WebSocket notification to the command initiator using their email
      await this.webPubSubService.broadcastMessage(initiatedByEmail, {
        type: 'cameraFailure',
        psoEmail: psoUser.email,
        psoName: psoUser.fullName,
        stage,
        errorMessage: friendlyMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Fail silently - notification failures shouldn't break error logging
      // Log for debugging but don't throw
      console.error('[CameraFailureApplicationService] Failed to notify command initiator', {
        error,
        psoAdId,
        initiatedByEmail
      });
    }
  }
}


