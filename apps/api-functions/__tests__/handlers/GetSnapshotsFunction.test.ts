import { Context, HttpRequest } from '@azure/functions';
import { GetSnapshotsApplicationService } from '../../src/application/services/GetSnapshotsApplicationService';
import { GetSnapshotsRequest } from '../../src/domain/value-objects/GetSnapshotsRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('GetSnapshotsFunction handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<GetSnapshotsApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'GET' });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
    };

    mockApplicationService = {
      getSnapshots: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully get snapshots', async () => {
    const mockResponse = {
      reports: [
        {
          id: 'snapshot-1',
          supervisorId: 'supervisor-id',
          psoId: 'pso-id',
          reasonId: 'reason-id',
          description: 'Test snapshot',
          takenAt: new Date(),
          imageUrl: 'https://example.com/image.jpg',
        },
      ],
      toPayload: jest.fn().mockReturnValue({
        reports: [
          {
            id: 'snapshot-1',
            supervisorId: 'supervisor-id',
            psoId: 'pso-id',
            reasonId: 'reason-id',
            description: 'Test snapshot',
            takenAt: new Date().toISOString(),
            imageUrl: 'https://example.com/image.jpg',
          },
        ],
      }),
    };

    mockApplicationService.getSnapshots.mockResolvedValue(mockResponse as any);

    const getSnapshotsFunction = (await import('../../src/handlers/GetSnapshotsFunction')).default;
    await getSnapshotsFunction(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('GetSnapshotsApplicationService');
    expect(mockApplicationService.getSnapshots).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(GetSnapshotsRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

});

