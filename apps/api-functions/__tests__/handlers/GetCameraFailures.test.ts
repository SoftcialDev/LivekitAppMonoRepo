import { Context, HttpRequest } from '@azure/functions';
import { GetCameraFailuresApplicationService } from '../../src/application/services/GetCameraFailuresApplicationService';
import { GetCameraFailuresRequest } from '../../src/domain/value-objects/GetCameraFailuresRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetCameraFailures handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetCameraFailuresApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        stage: 'STAGE_1',
        limit: '10',
        offset: '0',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getCameraFailures: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully get camera failures', async () => {
    const mockFailures = [
      {
        id: 'failure-1',
        stage: 'STAGE_1',
        userEmail: 'user@example.com',
        userAdId: 'user-ad-id',
        timestamp: new Date(),
      },
      {
        id: 'failure-2',
        stage: 'STAGE_2',
        userEmail: 'user2@example.com',
        userAdId: 'user-ad-id-2',
        timestamp: new Date(),
      },
    ];

    mockApplicationService.getCameraFailures.mockResolvedValue({
      failures: mockFailures as any,
      total: 2,
    });

    const getCameraFailuresHandler = (await import('../../src/handlers/GetCameraFailures')).default;
    await getCameraFailuresHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetCameraFailuresApplicationService');
    expect(mockApplicationService.getCameraFailures).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toBeDefined();
  });
});


