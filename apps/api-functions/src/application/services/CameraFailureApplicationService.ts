import { ICameraFailureService } from '../../index';
import { CameraStartFailureRequest } from '../../index';
import { ICameraStartFailureRepository } from '../../index';
import { CameraFailureReport } from '../../index';
import { CreateCameraStartFailureData } from '../../index';

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
    const persistenceData = report.toPersistence() as unknown as CreateCameraStartFailureData;
    await this.repo.create(persistenceData);
  }
}


