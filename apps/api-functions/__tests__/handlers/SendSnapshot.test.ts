import { Context, HttpRequest } from '@azure/functions';
import { SendSnapshotApplicationService } from '../../src/application/services/SendSnapshotApplicationService';
import { SendSnapshotRequest } from '../../src/domain/value-objects/SendSnapshotRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('SendSnapshot handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<SendSnapshotApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'POST',
      body: {
        psoEmail: 'pso@example.com',
        reasonId: 'reason-id',
        description: 'Test snapshot',
        imageBase64: 'base64encodedimage',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: mockRequest.body,
    };

    mockApplicationService = {
      sendSnapshot: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully send snapshot', async () => {
    const mockResponse = {
      snapshotId: 'snapshot-id',
      toPayload: jest.fn().mockReturnValue({
        snapshotId: 'snapshot-id',
      }),
    };

    mockApplicationService.sendSnapshot.mockResolvedValue(mockResponse as any);

    const sendSnapshotHandler = (await import('../../src/handlers/SendSnapshot')).default;
    await sendSnapshotHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('SendSnapshotApplicationService');
    expect(mockApplicationService.sendSnapshot).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(SendSnapshotRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

});

