import { Context } from '@azure/functions';
import { UserDeletionApplicationService } from '../../src/application/services/UserDeletionApplicationService';
import { UserDeletionRequest } from '../../src/domain/value-objects/UserDeletionRequest';
import { UserDeletionType } from '../../src/domain/enums/UserDeletionType';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../src/domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../src/domain/interfaces/IAuditService';
import { IPresenceService } from '../../src/domain/interfaces/IPresenceService';
import { IWebPubSubService } from '../../src/domain/interfaces/IWebPubSubService';
import { createMockContext, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';

jest.mock('../../src/application/services/UserDeletionApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('DeleteUser handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<UserDeletionApplicationService>;
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
        reason: 'Test deletion reason',
      },
    };

    mockUserRepository = {} as any;
    mockAuthorizationService = {} as any;
    mockAuditService = {} as any;
    mockPresenceService = {} as any;
    mockWebPubSubService = {} as any;

    mockApplicationService = {
      deleteUser: jest.fn(),
    } as any;

    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;
    
    mockResolve
      .mockReturnValueOnce(mockUserRepository)
      .mockReturnValueOnce(mockAuthorizationService)
      .mockReturnValueOnce(mockAuditService)
      .mockReturnValueOnce(mockPresenceService)
      .mockReturnValueOnce(mockWebPubSubService);

    (UserDeletionApplicationService as jest.MockedClass<typeof UserDeletionApplicationService>).mockImplementation(() => mockApplicationService as any);
  });

  it('should successfully delete user', async () => {
    const mockResult = {
      isSuccess: jest.fn().mockReturnValue(true),
      userEmail: 'user@example.com',
      getDeletionTypeString: jest.fn().mockReturnValue('SOFT_DELETE'),
      getPreviousRoleString: jest.fn().mockReturnValue('PSO'),
      getMessage: jest.fn().mockReturnValue('User soft deleted successfully'),
      timestamp: new Date(),
    };

    mockApplicationService.deleteUser.mockResolvedValue(mockResult as any);

    const deleteUser = (await import('../../src/handlers/DeleteUser')).default;
    await deleteUser(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('UserRepository');
    expect(mockResolve).toHaveBeenCalledWith('AuthorizationService');
    expect(mockResolve).toHaveBeenCalledWith('IAuditService');
    expect(mockResolve).toHaveBeenCalledWith('PresenceService');
    expect(mockResolve).toHaveBeenCalledWith('WebPubSubService');
    expect(mockApplicationService.deleteUser).toHaveBeenCalledWith(
      expect.any(UserDeletionRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      success: true,
      userEmail: 'user@example.com',
      deletionType: 'SOFT_DELETE',
      previousRole: 'PSO',
      message: 'User soft deleted successfully',
      timestamp: mockResult.timestamp,
    });
  });


  it('should create UserDeletionRequest with SOFT_DELETE type', async () => {
    const mockResult = {
      isSuccess: jest.fn().mockReturnValue(true),
      userEmail: 'user@example.com',
      getDeletionTypeString: jest.fn().mockReturnValue('SOFT_DELETE'),
      getPreviousRoleString: jest.fn().mockReturnValue('PSO'),
      getMessage: jest.fn().mockReturnValue('User soft deleted successfully'),
      timestamp: new Date(),
    };

    mockApplicationService.deleteUser.mockResolvedValue(mockResult as any);

    const deleteUser = (await import('../../src/handlers/DeleteUser')).default;
    await deleteUser(mockContext);

    const deleteCall = mockApplicationService.deleteUser.mock.calls[0];
    const request = deleteCall[0] as UserDeletionRequest;
    
    expect(request.userEmail).toBe('user@example.com');
    expect(request.deletionType).toBe(UserDeletionType.SOFT_DELETE);
    expect(request.reason).toBe('Test deletion reason');
  });
});

