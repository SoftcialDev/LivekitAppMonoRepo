import { Context, HttpRequest } from '@azure/functions';
import { GraphService } from '../../src/infrastructure/services/GraphService';
import prisma from '../../src/infrastructure/database/PrismaClientService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';

jest.mock('../../src/infrastructure/services/GraphService');
jest.mock('../../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    $executeRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('SyncTenantUsers handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockGraphService: jest.Mocked<GraphService>;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
    };

    mockGraphService = {
      getGraphToken: jest.fn(),
      fetchAllUsers: jest.fn(),
    } as any;

    (GraphService as jest.Mock).mockImplementation(() => mockGraphService);
  });

  it('should return 400 for non-POST requests', async () => {
    mockRequest.method = 'GET';

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    await syncTenantUsersHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
  });

  it('should successfully sync tenant users', async () => {
    const mockToken = 'test-token';
    const mockGraphUsers = [
      {
        id: 'user-1',
        mail: 'user1@example.com',
        userPrincipalName: 'user1@example.com',
        displayName: 'User One',
        accountEnabled: true,
      },
      {
        id: 'user-2',
        mail: 'user2@example.com',
        userPrincipalName: 'user2@example.com',
        displayName: 'User Two',
        accountEnabled: true,
      },
    ];

    mockGraphService.getGraphToken.mockResolvedValue(mockToken);
    mockGraphService.fetchAllUsers.mockResolvedValue(mockGraphUsers);
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user-id', email: 'user1@example.com' });

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    await syncTenantUsersHandler(mockContext, mockRequest);

    expect(mockGraphService.getGraphToken).toHaveBeenCalled();
    expect(mockGraphService.fetchAllUsers).toHaveBeenCalledWith(mockToken);
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.success).toBe(true);
  });
});

