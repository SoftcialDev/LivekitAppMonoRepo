import { SendSnapshotApplicationService } from '../../../src/application/services/SendSnapshotApplicationService';
import { SendSnapshotDomainService } from '../../../src/domain/services/SendSnapshotDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { SendSnapshotRequest } from '../../../src/domain/value-objects/SendSnapshotRequest';
import { SendSnapshotResponse } from '../../../src/domain/value-objects/SendSnapshotResponse';
import { UserRole } from '@prisma/client';

describe('SendSnapshotApplicationService', () => {
  let service: SendSnapshotApplicationService;
  let mockDomainService: jest.Mocked<SendSnapshotDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      sendSnapshot: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn(),
    } as any;

    service = new SendSnapshotApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully send snapshot', async () => {
    const callerId = 'test-caller-id';
    const request = new SendSnapshotRequest(
      callerId,
      'pso@example.com',
      'reason-id',
      'Test snapshot',
      'base64-image-data'
    );
    const mockResponse = new SendSnapshotResponse('snapshot-id', 'Snapshot sent successfully');

    mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
    mockDomainService.sendSnapshot.mockResolvedValue(mockResponse);

    const result = await service.sendSnapshot(callerId, request);

    expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
      callerId,
      [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin],
      'sending snapshots'
    );
    expect(mockDomainService.sendSnapshot).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const request = new SendSnapshotRequest(
      callerId,
      'pso@example.com',
      'reason-id',
      'Test snapshot',
      'base64-image-data'
    );

    mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.sendSnapshot(callerId, request)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.sendSnapshot).not.toHaveBeenCalled();
  });
});

