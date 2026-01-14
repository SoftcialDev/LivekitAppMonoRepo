import { GetSnapshotReasonsApplicationService } from '../../../src/application/services/GetSnapshotReasonsApplicationService';
import { GetSnapshotReasonsDomainService } from '../../../src/domain/services/GetSnapshotReasonsDomainService';
import { SnapshotReasonResponse } from '../../../src/domain/value-objects/SnapshotReasonResponse';

describe('GetSnapshotReasonsApplicationService', () => {
  let service: GetSnapshotReasonsApplicationService;
  let mockDomainService: jest.Mocked<GetSnapshotReasonsDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getSnapshotReasons: jest.fn(),
    } as any;

    service = new GetSnapshotReasonsApplicationService(mockDomainService);
  });

  it('should successfully get snapshot reasons', async () => {
    const mockReasons = [
      new SnapshotReasonResponse(
        'reason-1',
        'Reason 1',
        'REASON_1',
        false,
        true,
        1
      ),
    ];

    mockDomainService.getSnapshotReasons.mockResolvedValue(mockReasons);

    const result = await service.getSnapshotReasons();

    expect(mockDomainService.getSnapshotReasons).toHaveBeenCalled();
    expect(result).toBe(mockReasons);
  });
});

