import { GetCurrentUserApplicationService } from '../../../src/application/services/GetCurrentUserApplicationService';
import { GetCurrentUserDomainService } from '../../../src/domain/services/GetCurrentUserDomainService';
import { GetCurrentUserRequest } from '../../../src/domain/value-objects/GetCurrentUserRequest';
import { GetCurrentUserResponse } from '../../../src/domain/value-objects/GetCurrentUserResponse';
import { JwtPayload } from 'jsonwebtoken';

describe('GetCurrentUserApplicationService', () => {
  let service: GetCurrentUserApplicationService;
  let mockDomainService: jest.Mocked<GetCurrentUserDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getCurrentUser: jest.fn(),
    } as any;

    service = new GetCurrentUserApplicationService(mockDomainService);
  });

  it('should successfully get current user', async () => {
    const request = new GetCurrentUserRequest('test-azure-ad-id');
    const jwtPayload: JwtPayload = {
      oid: 'test-azure-ad-id',
      email: 'test@example.com',
    };
    const mockResponse = new GetCurrentUserResponse(
      'test-azure-ad-id',
      'test@example.com',
      'Test',
      'User',
      'PSO' as any,
      undefined,
      undefined,
      [],
      false
    );

    mockDomainService.getCurrentUser.mockResolvedValue(mockResponse);

    const result = await service.getCurrentUser(request, jwtPayload);

    expect(mockDomainService.getCurrentUser).toHaveBeenCalledWith(request, jwtPayload);
    expect(result).toBe(mockResponse);
  });
});

