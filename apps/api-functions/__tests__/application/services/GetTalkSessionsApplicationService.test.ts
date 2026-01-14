import { GetTalkSessionsApplicationService } from '../../../src/application/services/GetTalkSessionsApplicationService';
import { GetTalkSessionsDomainService } from '../../../src/domain/services/GetTalkSessionsDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetTalkSessionsRequest } from '../../../src/domain/value-objects/GetTalkSessionsRequest';
import { GetTalkSessionsResponse } from '../../../src/domain/value-objects/GetTalkSessionsResponse';
import { UserRole } from '../../../src/domain/enums/UserRole';

describe('GetTalkSessionsApplicationService', () => {
  let service: GetTalkSessionsApplicationService;
  let mockDomainService: jest.Mocked<GetTalkSessionsDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockDomainService = {
      getTalkSessions: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserWithRoles: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    service = new GetTalkSessionsApplicationService(
      mockDomainService,
      mockAuthorizationService,
      mockUserRepository
    );
  });

  it('should successfully get talk sessions', async () => {
    const callerId = 'test-caller-id';
    const request = new GetTalkSessionsRequest(callerId, 1, 10);
    const mockResponse = new GetTalkSessionsResponse([], 0, 1, 10);

    mockAuthorizationService.authorizeUserWithRoles.mockResolvedValue(undefined);
    mockDomainService.getTalkSessions.mockResolvedValue(mockResponse);

    const result = await service.getTalkSessions(callerId, request);

    expect(mockAuthorizationService.authorizeUserWithRoles).toHaveBeenCalledWith(
      callerId,
      [UserRole.Admin, UserRole.SuperAdmin],
      'viewing talk session reports'
    );
    expect(mockDomainService.getTalkSessions).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const request = new GetTalkSessionsRequest(callerId, 1, 10);

    mockAuthorizationService.authorizeUserWithRoles.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.getTalkSessions(callerId, request)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.getTalkSessions).not.toHaveBeenCalled();
  });
});

