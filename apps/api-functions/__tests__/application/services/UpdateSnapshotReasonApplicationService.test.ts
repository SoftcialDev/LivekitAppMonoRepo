import { UpdateSnapshotReasonApplicationService } from '../../../src/application/services/UpdateSnapshotReasonApplicationService';
import { UpdateSnapshotReasonDomainService } from '../../../src/domain/services/UpdateSnapshotReasonDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { SnapshotReasonResponse } from '../../../src/domain/value-objects/SnapshotReasonResponse';
import { UserRole } from '@prisma/client';

describe('UpdateSnapshotReasonApplicationService', () => {
  let service: UpdateSnapshotReasonApplicationService;
  let mockDomainService: jest.Mocked<UpdateSnapshotReasonDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      updateSnapshotReason: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn(),
    } as any;

    service = new UpdateSnapshotReasonApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully update snapshot reason', async () => {
    const callerId = 'test-caller-id';
    const id = 'reason-id';
    const data = {
      label: 'Updated Reason',
      order: 2,
    };
    const mockResponse = new SnapshotReasonResponse(
      'reason-id',
      'Updated Reason',
      'REASON_1',
      false,
      true,
      2
    );

    mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
    mockDomainService.updateSnapshotReason.mockResolvedValue(mockResponse);

    const result = await service.updateSnapshotReason(callerId, id, data);

    expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
      callerId,
      [UserRole.Admin, UserRole.SuperAdmin],
      'updating snapshot reasons'
    );
    expect(mockDomainService.updateSnapshotReason).toHaveBeenCalledWith(id, data);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const id = 'reason-id';
    const data = { label: 'Updated Reason' };

    mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.updateSnapshotReason(callerId, id, data)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.updateSnapshotReason).not.toHaveBeenCalled();
  });
});

