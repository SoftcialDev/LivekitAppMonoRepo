import { ICameraFailureService } from '../../index';
import { CameraStartFailureRequest } from '../../index';
import { ICameraStartFailureRepository } from '../../index';
import { CameraFailureReport } from '../../index';

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


