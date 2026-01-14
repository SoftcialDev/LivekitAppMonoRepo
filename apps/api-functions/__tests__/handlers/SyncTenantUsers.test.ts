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

  it('should skip users with accountEnabled false', async () => {
    const mockToken = 'test-token';
    const mockGraphUsers = [
      {
        id: 'user-1',
        mail: 'user1@example.com',
        userPrincipalName: 'user1@example.com',
        displayName: 'User One',
        accountEnabled: false,
      },
    ];

    mockGraphService.getGraphToken.mockResolvedValue(mockToken);
    mockGraphService.fetchAllUsers.mockResolvedValue(mockGraphUsers);
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    await syncTenantUsersHandler(mockContext, mockRequest);

    expect(mockContext.res?.body.stats.skipped).toBe(1);
  });

  it('should skip users without email', async () => {
    const mockToken = 'test-token';
    const mockGraphUsers = [
      {
        id: 'user-1',
        mail: undefined,
        userPrincipalName: undefined,
        displayName: 'User One',
        accountEnabled: true,
      },
    ];

    mockGraphService.getGraphToken.mockResolvedValue(mockToken);
    mockGraphService.fetchAllUsers.mockResolvedValue(mockGraphUsers);
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    await syncTenantUsersHandler(mockContext, mockRequest);

    expect(mockContext.res?.body.stats.skipped).toBe(1);
  });

  it('should handle updated users', async () => {
    const mockToken = 'test-token';
    const mockGraphUsers = [
      {
        id: 'user-1',
        mail: 'user1@example.com',
        userPrincipalName: 'user1@example.com',
        displayName: 'Updated Name',
        accountEnabled: true,
      },
    ];

    mockGraphService.getGraphToken.mockResolvedValue(mockToken);
    mockGraphService.fetchAllUsers.mockResolvedValue(mockGraphUsers);
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id',
      email: 'user1@example.com',
      fullName: 'Old Name',
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-id', email: 'user1@example.com' });

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    await syncTenantUsersHandler(mockContext, mockRequest);

    expect(mockContext.res?.body.stats.updated).toBe(1);
    expect(mockContext.log.info).toHaveBeenCalledWith(expect.stringContaining('[SyncTenantUsers] Updated user:'));
  });

  it('should handle errors when processing individual users', async () => {
    const mockToken = 'test-token';
    const mockGraphUsers = [
      {
        id: 'user-1',
        mail: 'user1@example.com',
        userPrincipalName: 'user1@example.com',
        displayName: 'User One',
        accountEnabled: true,
      },
    ];

    mockGraphService.getGraphToken.mockResolvedValue(mockToken);
    mockGraphService.fetchAllUsers.mockResolvedValue(mockGraphUsers);
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    await syncTenantUsersHandler(mockContext, mockRequest);

    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.stringContaining('[SyncTenantUsers] Error processing user'),
      expect.any(Error)
    );
    expect(mockContext.res?.body.stats.skipped).toBe(1);
  });

  it('should handle sync failure', async () => {
    const mockToken = 'test-token';

    mockGraphService.getGraphToken.mockResolvedValue(mockToken);
    mockGraphService.fetchAllUsers.mockRejectedValue(new Error('Graph API error'));
    (prisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);

    const syncTenantUsersHandler = (await import('../../src/handlers/SyncTenantUsers')).default;
    
    await expect(syncTenantUsersHandler(mockContext, mockRequest)).rejects.toThrow('Graph API error');
    expect(mockContext.log.error).toHaveBeenCalledWith(
      '[SyncTenantUsers] Sync failed:',
      expect.any(Error)
    );
  });
});

