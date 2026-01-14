import { Context, HttpRequest } from '@azure/functions';
import { UpdateSnapshotReasonsBatchApplicationService } from '../../src/application/services/UpdateSnapshotReasonsBatchApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('UpdateSnapshotReasonsBatch handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<UpdateSnapshotReasonsBatchApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'PUT',
      body: {
        reasons: [
          {
            id: 'reason-1',
            label: 'Updated Reason 1',
            order: 1,
          },
          {
            id: 'reason-2',
            label: 'Updated Reason 2',
            order: 2,
          },
        ],
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        reasons: [
          {
            id: 'reason-1',
            label: 'Updated Reason 1',
            order: 1,
          },
          {
            id: 'reason-2',
            label: 'Updated Reason 2',
            order: 2,
          },
        ],
      },
    };

    mockApplicationService = {
      updateSnapshotReasonsBatch: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully update snapshot reasons batch', async () => {
    mockApplicationService.updateSnapshotReasonsBatch.mockResolvedValue(undefined);

    const updateSnapshotReasonsBatchHandler = (await import('../../src/handlers/UpdateSnapshotReasonsBatch')).default;
    await updateSnapshotReasonsBatchHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('UpdateSnapshotReasonsBatchApplicationService');
    expect(mockApplicationService.updateSnapshotReasonsBatch).toHaveBeenCalledWith(
      'test-azure-ad-id',
      [
        {
          id: 'reason-1',
          label: 'Updated Reason 1',
          order: 1,
        },
        {
          id: 'reason-2',
          label: 'Updated Reason 2',
          order: 2,
        },
      ]
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({ message: 'Snapshot reasons updated successfully' });
  });

  it('should handle empty reasons array', async () => {
    mockRequest.body = {
      reasons: [],
    };
    mockContext.bindings.validatedBody = {
      reasons: [],
    };

    mockApplicationService.updateSnapshotReasonsBatch.mockResolvedValue(undefined);

    const updateSnapshotReasonsBatchHandler = (await import('../../src/handlers/UpdateSnapshotReasonsBatch')).default;
    await updateSnapshotReasonsBatchHandler(mockContext, mockRequest);

    expect(mockApplicationService.updateSnapshotReasonsBatch).toHaveBeenCalledWith('test-azure-ad-id', []);
    expect(mockContext.res?.status).toBe(200);
  });
});

