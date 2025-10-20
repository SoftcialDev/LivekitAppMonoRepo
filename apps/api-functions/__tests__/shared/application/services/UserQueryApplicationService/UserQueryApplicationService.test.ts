/**
 * @fileoverview UserQueryApplicationService - unit tests
 */

import { UserQueryApplicationService } from '../../../../../shared/application/services/UserQueryApplicationService';
import { ValidationError } from '../../../../../shared/domain/errors/DomainError';
import { ValidationErrorCode } from '../../../../../shared/domain/errors/ErrorCodes';

describe('UserQueryApplicationService', () => {
  let service: UserQueryApplicationService;
  let mockUserRepository: any;
  let mockAuthService: any;
  let mockUserQueryService: any;

  beforeEach(() => {
    mockUserRepository = {};
    mockAuthService = {
      authorizeUserQuery: jest.fn()
    };
    mockUserQueryService = {
      findUsersByRoles: jest.fn()
    };
    service = new UserQueryApplicationService(mockUserRepository, mockAuthService, mockUserQueryService);
  });

  describe('getUsersByRole', () => {
    it('authorizes, validates and delegates to query service', async () => {
      const request = { roles: ['Admin'] } as any;
      const callerId = 'caller123';
      const expectedResult = { users: [] } as any;
      
      mockAuthService.authorizeUserQuery.mockResolvedValue(undefined);
      mockUserQueryService.findUsersByRoles.mockResolvedValue(expectedResult);

      const result = await service.getUsersByRole(request, callerId);

      expect(mockAuthService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockUserQueryService.findUsersByRoles).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResult);
    });

    it('throws ValidationError when roles array is empty', async () => {
      const request = { roles: [] } as any;
      const callerId = 'caller123';
      
      mockAuthService.authorizeUserQuery.mockResolvedValue(undefined);

      await expect(service.getUsersByRole(request, callerId))
        .rejects
        .toThrow(ValidationError);
    });
  });
});