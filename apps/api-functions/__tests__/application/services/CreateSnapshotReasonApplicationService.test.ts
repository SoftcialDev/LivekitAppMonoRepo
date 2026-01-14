import { CreateSnapshotReasonApplicationService } from '../../../src/application/services/CreateSnapshotReasonApplicationService';
import { CreateSnapshotReasonDomainService } from '../../../src/domain/services/CreateSnapshotReasonDomainService';
import { CreateSnapshotReasonRequest } from '../../../src/domain/value-objects/CreateSnapshotReasonRequest';
import { SnapshotReasonResponse } from '../../../src/domain/value-objects/SnapshotReasonResponse';

describe('CreateSnapshotReasonApplicationService', () => {
  let service: CreateSnapshotReasonApplicationService;
  let mockDomainService: jest.Mocked<CreateSnapshotReasonDomainService>;

  beforeEach(() => {
    mockDomainService = {
      createSnapshotReason: jest.fn(),
    } as any;

    service = new CreateSnapshotReasonApplicationService(mockDomainService);
  });

  it('should successfully create snapshot reason', async () => {
    const callerId = 'test-caller-id';
    const request = new CreateSnapshotReasonRequest('Test Reason', 'TEST_REASON', 1);
    const mockResponse = new SnapshotReasonResponse(
      'reason-id',
      'Test Reason',
      'TEST_REASON',
      false,
      true,
      1
    );

    mockDomainService.createSnapshotReason.mockResolvedValue(mockResponse);

    const result = await service.createSnapshotReason(callerId, request);

    expect(mockDomainService.createSnapshotReason).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

