import { GetSnapshotsApplicationService } from '../../../src/application/services/GetSnapshotsApplicationService';
import { GetSnapshotsDomainService } from '../../../src/domain/services/GetSnapshotsDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { GetSnapshotsRequest } from '../../../src/domain/value-objects/GetSnapshotsRequest';
import { GetSnapshotsResponse } from '../../../src/domain/value-objects/GetSnapshotsResponse';
import { UserRole } from '@prisma/client';

describe('GetSnapshotsApplicationService', () => {
  let service: GetSnapshotsApplicationService;
  let mockDomainService: jest.Mocked<GetSnapshotsDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      getSnapshots: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn(),
    } as any;

    service = new GetSnapshotsApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully get snapshots', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSnapshotsRequest(callerId);
    const mockResponse = new GetSnapshotsResponse([]);

    mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
    mockDomainService.getSnapshots.mockResolvedValue(mockResponse);

    const result = await service.getSnapshots(callerId, request);

    expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
      callerId,
      [UserRole.Admin, UserRole.SuperAdmin],
      'viewing snapshots'
    );
    expect(mockDomainService.getSnapshots).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSnapshotsRequest(callerId);

    mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.getSnapshots(callerId, request)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.getSnapshots).not.toHaveBeenCalled();
  });
});






