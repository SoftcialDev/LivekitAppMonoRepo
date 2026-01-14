import { Context, HttpRequest } from '@azure/functions';
import { DeleteSnapshotApplicationService } from '../../src/application/services/DeleteSnapshotApplicationService';
import { DeleteSnapshotRequest } from '../../src/domain/value-objects/DeleteSnapshotRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('DeleteSnapshotFunction handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<DeleteSnapshotApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'DELETE',
      params: {
        id: 'snapshot-id-123',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedParams: {
        id: 'snapshot-id-123',
      },
    };

    mockApplicationService = {
      deleteSnapshot: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully delete snapshot', async () => {
    const mockResponse = {
      deletedId: 'snapshot-id-123',
      message: 'Snapshot deleted successfully',
      toPayload: jest.fn().mockReturnValue({
        deletedId: 'snapshot-id-123',
        message: 'Snapshot deleted successfully',
      }),
    };

    mockApplicationService.deleteSnapshot.mockResolvedValue(mockResponse as any);

    const deleteSnapshotFunction = (await import('../../src/handlers/DeleteSnapshotFunction')).default;
    await deleteSnapshotFunction(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('DeleteSnapshotApplicationService');
    expect(mockApplicationService.deleteSnapshot).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(DeleteSnapshotRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

