import { UserQueryApplicationService } from '../../../src/application/services/UserQueryApplicationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { IUserQueryService } from '../../../src/domain/interfaces/IUserQueryService';
import { UserQueryRequest } from '../../../src/domain/value-objects/UserQueryRequest';
import { UserQueryResult } from '../../../src/domain/value-objects/UserQueryResult';
import { ValidationError } from '../../../src/domain/errors/DomainError';
import { UserRole } from '@prisma/client';

describe('UserQueryApplicationService', () => {
  let service: UserQueryApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockUserQueryService: jest.Mocked<IUserQueryService>;

  beforeEach(() => {
    mockUserRepository = {} as any;
    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;
    mockUserQueryService = {
      findUsersByRoles: jest.fn(),
    } as any;

    service = new UserQueryApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockUserQueryService
    );
  });

  describe('getUsersByRole', () => {
    const callerId = 'test-caller-id';

    it('should successfully get users by role', async () => {
      const request = new UserQueryRequest([UserRole.PSO], 1, 10);
      const mockResult = UserQueryResult.create(1, 1, 10, []);

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue(undefined);
      mockUserQueryService.findUsersByRoles.mockResolvedValue(mockResult);

      const result = await service.getUsersByRole(request, callerId);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockUserQueryService.findUsersByRoles).toHaveBeenCalledWith(request);
      expect(result).toBe(mockResult);
    });

    it('should throw error when roles array is empty', async () => {
      const request = new UserQueryRequest([], 1, 10);

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue(undefined);

      await expect(service.getUsersByRole(request, callerId)).rejects.toThrow(ValidationError);
      expect(mockUserQueryService.findUsersByRoles).not.toHaveBeenCalled();
    });

    it('should throw error when authorization fails', async () => {
      const request = new UserQueryRequest([UserRole.PSO], 1, 10);

      mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Unauthorized'));

      await expect(service.getUsersByRole(request, callerId)).rejects.toThrow('Unauthorized');
      expect(mockUserQueryService.findUsersByRoles).not.toHaveBeenCalled();
    });
  });
});






