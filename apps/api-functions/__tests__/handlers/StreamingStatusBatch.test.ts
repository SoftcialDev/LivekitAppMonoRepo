import { Context, HttpRequest } from '@azure/functions';
import { StreamingStatusBatchApplicationService } from '../../src/application/services/StreamingStatusBatchApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ...jest.requireActual('../../src/infrastructure/container/ServiceContainer'),
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('StreamingStatusBatch handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<StreamingStatusBatchApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'POST',
      body: {
        emails: ['user1@example.com', 'user2@example.com'],
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getBatchStatus: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully get batch streaming status', async () => {
    const mockResponse = {
      statuses: [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: null,
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: new Date(),
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        statuses: [
          {
            email: 'user1@example.com',
            hasActiveSession: true,
            lastSession: null,
          },
          {
            email: 'user2@example.com',
            hasActiveSession: false,
            lastSession: new Date(),
          },
        ],
      }),
    };

    mockApplicationService.getBatchStatus.mockResolvedValue(mockResponse as any);

    const streamingStatusBatchHandler = (await import('../../src/handlers/StreamingStatusBatch')).default;
    await streamingStatusBatchHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('StreamingStatusBatchApplicationService');
    expect(mockApplicationService.getBatchStatus).toHaveBeenCalledWith(
      ['user1@example.com', 'user2@example.com'],
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should return 400 when emails array is invalid', async () => {
    mockRequest.body = {
      emails: 'invalid',
    };

    const streamingStatusBatchHandler = (await import('../../src/handlers/StreamingStatusBatch')).default;
    await streamingStatusBatchHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(400);
  });
});


