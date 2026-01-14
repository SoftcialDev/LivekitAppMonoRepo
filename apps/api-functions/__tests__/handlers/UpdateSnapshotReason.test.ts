import { Context, HttpRequest } from '@azure/functions';
import { UpdateSnapshotReasonApplicationService } from '../../src/application/services/UpdateSnapshotReasonApplicationService';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('UpdateSnapshotReason handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<UpdateSnapshotReasonApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'PUT',
      body: {
        id: 'reason-id-123',
        label: 'Updated Reason',
        code: 'UPDATED_REASON',
        isDefault: false,
        isActive: true,
        order: 1,
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: mockRequest.body,
    };

    mockApplicationService = {
      updateSnapshotReason: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully update snapshot reason', async () => {
    const mockResponse = {
      id: 'reason-id-123',
      label: 'Updated Reason',
      code: 'UPDATED_REASON',
      isDefault: false,
      isActive: true,
      order: 1,
      toJSON: jest.fn().mockReturnValue({
        id: 'reason-id-123',
        label: 'Updated Reason',
        code: 'UPDATED_REASON',
        isDefault: false,
        isActive: true,
        order: 1,
      }),
    };

    mockApplicationService.updateSnapshotReason.mockResolvedValue(mockResponse as any);

    const updateSnapshotReasonHandler = (await import('../../src/handlers/UpdateSnapshotReason')).default;
    await updateSnapshotReasonHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('UpdateSnapshotReasonApplicationService');
    expect(mockApplicationService.updateSnapshotReason).toHaveBeenCalledWith(
      'test-azure-ad-id',
      'reason-id-123',
      expect.objectContaining({
        label: 'Updated Reason',
        code: 'UPDATED_REASON',
        isDefault: false,
        isActive: true,
        order: 1,
      })
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toJSON());
  });
});

