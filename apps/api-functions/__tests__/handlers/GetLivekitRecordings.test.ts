import { Context, HttpRequest } from '@azure/functions';
import { GetLivekitRecordingsApplicationService } from '../../src/application/services/GetLivekitRecordingsApplicationService';
import { GetLivekitRecordingsRequest } from '../../src/domain/value-objects/GetLivekitRecordingsRequest';
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

describe('GetLivekitRecordings handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetLivekitRecordingsApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'GET',
      query: {
        limit: '10',
        offset: '0',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedQuery: {
        limit: 10,
        offset: 0,
      },
    };

    mockApplicationService = {
      getLivekitRecordings: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully get livekit recordings', async () => {
    const mockResponse = {
      items: [],
      count: 0,
      toPayload: jest.fn().mockReturnValue({
        items: [],
        count: 0,
      }),
    };

    mockApplicationService.getLivekitRecordings.mockResolvedValue(mockResponse as any);

    const getLivekitRecordingsHandler = (await import('../../src/handlers/GetLivekitRecordings')).default;
    await getLivekitRecordingsHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetLivekitRecordingsApplicationService');
    expect(mockApplicationService.getLivekitRecordings).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetLivekitRecordingsRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle recordings with items', async () => {
    const mockResponse = {
      items: [
        {
          id: 'recording-1',
          roomName: 'room-1',
          createdAt: new Date(),
        },
      ],
      count: 1,
      toPayload: jest.fn().mockReturnValue({
        items: [
          {
            id: 'recording-1',
            roomName: 'room-1',
            createdAt: new Date(),
          },
        ],
        count: 1,
      }),
    };

    mockApplicationService.getLivekitRecordings.mockResolvedValue(mockResponse as any);

    const getLivekitRecordingsHandler = (await import('../../src/handlers/GetLivekitRecordings')).default;
    await getLivekitRecordingsHandler(mockContext, mockRequest);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.items).toHaveLength(1);
  });
});

