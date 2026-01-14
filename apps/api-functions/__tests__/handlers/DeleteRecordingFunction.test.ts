import { Context, HttpRequest } from '@azure/functions';
import { DeleteRecordingApplicationService } from '../../src/application/services/DeleteRecordingApplicationService';
import { DeleteRecordingRequest } from '../../src/domain/value-objects/DeleteRecordingRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/config', () => ({
  config: {
    azureStorageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net',
    snapshotContainerName: 'test-container',
  },
}));
jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}), { virtual: true });

describe('DeleteRecordingFunction handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<DeleteRecordingApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'DELETE',
    });

    mockContext.bindingData = {
      id: 'recording-id-123',
      invocationId: 'test-invocation-id',
    };

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedParams: {
        id: 'recording-id-123',
      },
    };

    mockApplicationService = {
      deleteRecording: jest.fn(),
    } as any;

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully delete recording', async () => {
    const mockResponse = {
      blobDeleted: true,
      dbDeleted: true,
      toPayload: jest.fn().mockReturnValue({
        blobDeleted: true,
        dbDeleted: true,
        message: 'Recording deleted successfully',
      }),
    };

    mockApplicationService.deleteRecording.mockResolvedValue(mockResponse as any);

    const deleteRecordingHandler = (await import('../../src/handlers/DeleteRecordingFunction')).default;
    await deleteRecordingHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('DeleteRecordingApplicationService');
    expect(mockApplicationService.deleteRecording).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(DeleteRecordingRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});

