import { DeleteSnapshotReasonApplicationService } from '../../../src/application/services/DeleteSnapshotReasonApplicationService';
import { DeleteSnapshotReasonDomainService } from '../../../src/domain/services/DeleteSnapshotReasonDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';

describe('DeleteSnapshotReasonApplicationService', () => {
  let service: DeleteSnapshotReasonApplicationService;
  let mockDomainService: jest.Mocked<DeleteSnapshotReasonDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      deleteSnapshotReason: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new DeleteSnapshotReasonApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully delete snapshot reason', async () => {
    const callerId = 'test-caller-id';
    const id = 'reason-id';

    mockDomainService.deleteSnapshotReason.mockResolvedValue(undefined);

    await service.deleteSnapshotReason(callerId, id);

    expect(mockDomainService.deleteSnapshotReason).toHaveBeenCalledWith(id);
  });
});






