import { Context, HttpRequest } from '@azure/functions';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import prisma from '../../src/infrastructure/database/PrismaClientService';
import { getCallerAdId } from '../../src/utils/authHelpers';

jest.mock('../../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../src/utils/authHelpers', () => ({
  getCallerAdId: jest.fn(),
}));

describe('GetWebsocketPresenceStatus handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        page: '1',
        pageSize: '50',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
    };

    (getCallerAdId as jest.Mock).mockReturnValue('test-azure-ad-id');
  });

  it('should successfully get presence status', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      email: 'admin@example.com',
      deletedAt: null,
    });

    (prisma.user.count as jest.Mock).mockResolvedValue(10);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        email: 'user1@example.com',
        fullName: 'User 1',
        azureAdObjectId: 'user-1-id',
        role: 'PSO',
        presence: {
          status: 'online',
          lastSeenAt: new Date(),
        },
        supervisor: {
          id: 'supervisor-id',
          email: 'supervisor@example.com',
          fullName: 'Supervisor',
        },
      },
    ]);

    const getWebsocketPresenceStatusHandler = (await import('../../src/handlers/GetWebsocketPresenceStatus')).default;
    await getWebsocketPresenceStatusHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toHaveProperty('total');
    expect(mockContext.res?.body).toHaveProperty('page');
    expect(mockContext.res?.body).toHaveProperty('pageSize');
    expect(mockContext.res?.body).toHaveProperty('items');
  });

  it('should handle default pagination', async () => {
    mockRequest.query = {};

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id',
      azureAdObjectId: 'test-azure-ad-id',
      email: 'admin@example.com',
      deletedAt: null,
    });

    (prisma.user.count as jest.Mock).mockResolvedValue(0);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const getWebsocketPresenceStatusHandler = (await import('../../src/handlers/GetWebsocketPresenceStatus')).default;
    await getWebsocketPresenceStatusHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.page).toBe(1);
    expect(mockContext.res?.body.pageSize).toBe(50);
  });
});

