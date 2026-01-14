import { Context, HttpRequest } from '@azure/functions';
import { CreateSnapshotReasonApplicationService } from '../../src/application/services/CreateSnapshotReasonApplicationService';
import { CreateSnapshotReasonRequest } from '../../src/domain/value-objects/CreateSnapshotReasonRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('CreateSnapshotReason handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<CreateSnapshotReasonApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'POST',
      body: {
        label: 'Test Reason',
        code: 'TEST_REASON',
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
      createSnapshotReason: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully create snapshot reason', async () => {
    const mockResponse = {
      id: 'reason-id',
      label: 'Test Reason',
      code: 'TEST_REASON',
      isDefault: false,
      isActive: true,
      order: 1,
      toJSON: jest.fn().mockReturnValue({
        id: 'reason-id',
        label: 'Test Reason',
        code: 'TEST_REASON',
        isDefault: false,
        isActive: true,
        order: 1,
      }),
    };

    mockApplicationService.createSnapshotReason.mockResolvedValue(mockResponse as any);

    const createSnapshotReasonHandler = (await import('../../src/handlers/CreateSnapshotReason')).default;
    await createSnapshotReasonHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('CreateSnapshotReasonApplicationService');
    expect(mockApplicationService.createSnapshotReason).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(CreateSnapshotReasonRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toJSON());
  });

});

