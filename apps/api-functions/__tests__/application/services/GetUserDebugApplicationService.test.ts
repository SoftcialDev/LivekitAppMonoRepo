import { GetUserDebugApplicationService } from '../../../src/application/services/GetUserDebugApplicationService';
import { GetUserDebugDomainService } from '../../../src/domain/services/GetUserDebugDomainService';
import { GetUserDebugRequest } from '../../../src/domain/value-objects/GetUserDebugRequest';
import { GetUserDebugResponse } from '../../../src/domain/value-objects/GetUserDebugResponse';

describe('GetUserDebugApplicationService', () => {
  let service: GetUserDebugApplicationService;
  let mockDomainService: jest.Mocked<GetUserDebugDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getUserDebug: jest.fn(),
    } as any;

    service = new GetUserDebugApplicationService(mockDomainService);
  });

  it('should successfully get user debug info', async () => {
    const request = new GetUserDebugRequest('test-azure-ad-id');
    const mockResponse = new GetUserDebugResponse(
      {
        id: 'user-id',
        azureAdObjectId: 'test-azure-ad-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'PSO' as any,
        roleChangedAt: null,
        supervisorId: null,
        assignedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      [],
      [],
      null,
      null
    );

    mockDomainService.getUserDebug.mockResolvedValue(mockResponse);

    const result = await service.getUserDebug(request);

    expect(mockDomainService.getUserDebug).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

