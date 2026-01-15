import { Context } from '@azure/functions';
import { UserRoleChangeApplicationService } from '../../src/application/services/UserRoleChangeApplicationService';
import { UserRoleChangeRequest } from '../../src/domain/value-objects/UserRoleChangeRequest';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../src/domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../src/domain/interfaces/IAuditService';
import { IPresenceService } from '../../src/domain/interfaces/IPresenceService';
import { IWebPubSubService } from '../../src/domain/interfaces/IWebPubSubService';
import { createMockContext, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/application/services/UserRoleChangeApplicationService');

describe('ChangeUserRole handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<UserRoleChangeApplicationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockPresenceService: jest.Mocked<IPresenceService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });

    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        userEmail: 'user@example.com',
        newRole: 'PSO',
      },
    };

    mockUserRepository = {} as any;
    mockAuthorizationService = {} as any;
    mockAuditService = {} as any;
    mockPresenceService = {} as any;
    mockWebPubSubService = {} as any;

    mockApplicationService = {
      validateRoleChangeRequest: jest.fn(),
      changeUserRole: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;

    mockResolve
      .mockReturnValueOnce(mockUserRepository)
      .mockReturnValueOnce(mockAuthorizationService)
      .mockReturnValueOnce(mockAuditService)
      .mockReturnValueOnce(mockPresenceService)
      .mockReturnValueOnce(mockWebPubSubService);

    (UserRoleChangeApplicationService as jest.MockedClass<typeof UserRoleChangeApplicationService>).mockImplementation(() => mockApplicationService as any);
  });

  it('should successfully change user role', async () => {
    const mockResult = {
      getSummary: jest.fn().mockReturnValue('User role changed successfully'),
      getOperationType: jest.fn().mockReturnValue('ROLE_CHANGE'),
      userEmail: 'user@example.com',
      previousRole: 'PSO',
      newRole: 'Supervisor',
    };

    mockApplicationService.validateRoleChangeRequest.mockResolvedValue(undefined);
    mockApplicationService.changeUserRole.mockResolvedValue(mockResult as any);

    const changeUserRole = (await import('../../src/handlers/ChangeUserRole')).default;
    await changeUserRole(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockApplicationService.validateRoleChangeRequest).toHaveBeenCalledWith(
      expect.any(UserRoleChangeRequest),
      'test-azure-ad-id'
    );
    expect(mockApplicationService.changeUserRole).toHaveBeenCalledWith(
      expect.any(UserRoleChangeRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      message: 'User role changed successfully',
      operation: 'ROLE_CHANGE',
      userEmail: 'user@example.com',
      previousRole: 'PSO',
      newRole: 'Supervisor',
    });
  });
});


