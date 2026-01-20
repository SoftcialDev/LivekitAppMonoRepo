import { UpdateSnapshotReasonsBatchApplicationService } from '../../../src/application/services/UpdateSnapshotReasonsBatchApplicationService';
import { UpdateSnapshotReasonsBatchDomainService } from '../../../src/domain/services/UpdateSnapshotReasonsBatchDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { UserRole } from '@prisma/client';

describe('UpdateSnapshotReasonsBatchApplicationService', () => {
  let service: UpdateSnapshotReasonsBatchApplicationService;
  let mockDomainService: jest.Mocked<UpdateSnapshotReasonsBatchDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      updateSnapshotReasonsBatch: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn(),
    } as any;

    service = new UpdateSnapshotReasonsBatchApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully update snapshot reasons batch', async () => {
    const callerId = 'test-caller-id';
    const reasons = [
      {
        id: 'reason-1',
        label: 'Updated Reason 1',
        order: 1,
      },
    ];

    mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
    mockDomainService.updateSnapshotReasonsBatch.mockResolvedValue(undefined);

    await service.updateSnapshotReasonsBatch(callerId, reasons);

    expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
      callerId,
      [UserRole.Admin, UserRole.SuperAdmin],
      'batch updating snapshot reasons'
    );
    expect(mockDomainService.updateSnapshotReasonsBatch).toHaveBeenCalledWith(reasons);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const reasons = [{ id: 'reason-1', label: 'Updated Reason 1' }];

    mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.updateSnapshotReasonsBatch(callerId, reasons)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.updateSnapshotReasonsBatch).not.toHaveBeenCalled();
  });
});






