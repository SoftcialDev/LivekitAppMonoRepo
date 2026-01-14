import { DeleteSnapshotApplicationService } from '../../../src/application/services/DeleteSnapshotApplicationService';
import { DeleteSnapshotDomainService } from '../../../src/domain/services/DeleteSnapshotDomainService';
import { DeleteSnapshotRequest } from '../../../src/domain/value-objects/DeleteSnapshotRequest';
import { DeleteSnapshotResponse } from '../../../src/domain/value-objects/DeleteSnapshotResponse';

describe('DeleteSnapshotApplicationService', () => {
  let service: DeleteSnapshotApplicationService;
  let mockDomainService: jest.Mocked<DeleteSnapshotDomainService>;

  beforeEach(() => {
    mockDomainService = {
      deleteSnapshot: jest.fn(),
    } as any;

    service = new DeleteSnapshotApplicationService(mockDomainService);
  });

  it('should successfully delete snapshot', async () => {
    const callerId = 'test-caller-id';
    const request = new DeleteSnapshotRequest(callerId, 'snapshot-id');
    const mockResponse = new DeleteSnapshotResponse('snapshot-id', 'Snapshot deleted successfully');

    mockDomainService.deleteSnapshot.mockResolvedValue(mockResponse);

    const result = await service.deleteSnapshot(callerId, request);

    expect(mockDomainService.deleteSnapshot).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

