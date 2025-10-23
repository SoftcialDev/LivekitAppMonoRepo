import { ICameraFailureService } from "../../domain/interfaces/ICameraFailureService";
import { CameraStartFailureRequest } from "../../domain/schemas/CameraStartFailureSchema";
import { ICameraStartFailureRepository } from "../../domain/interfaces/ICameraStartFailureRepository";
import { CameraFailureReport } from "../../domain/value-objects/CameraFailureReport";

/**
 * Application service implementing camera start failure logging.
 */
export class CameraFailureApplicationService implements ICameraFailureService {
  constructor(
    private readonly repo: ICameraStartFailureRepository
  ) {}

  async logStartFailure(
    input: CameraStartFailureRequest & { userAdId: string; userEmail?: string }
  ): Promise<void> {
    const report = CameraFailureReport.fromRequest(input);
    await this.repo.create(report.toPersistence() as any);
  }
}


