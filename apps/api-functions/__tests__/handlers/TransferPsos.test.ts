import { Context, HttpRequest } from '@azure/functions';
import { TransferPsosApplicationService } from '../../src/application/services/TransferPsosApplicationService';
import { TransferPsosRequest } from '../../src/domain/value-objects/TransferPsosRequest';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

describe('TransferPsos handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<TransferPsosApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({
      method: 'POST',
      body: {
        newSupervisorEmail: 'newsupervisor@example.com',
      },
    });

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: mockRequest.body,
    };

    mockApplicationService = {
      transferPsos: jest.fn(),
    } as any;

    const { mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;
  });

  it('should successfully transfer PSOs', async () => {
    const mockResponse = {
      movedCount: 5,
      toPayload: jest.fn().mockReturnValue({
        movedCount: 5,
      }),
    };

    mockApplicationService.transferPsos.mockResolvedValue(mockResponse as any);

    const transferPsosHandler = (await import('../../src/handlers/TransferPsos')).default;
    await transferPsosHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('TransferPsosApplicationService');
    expect(mockApplicationService.transferPsos).toHaveBeenCalledWith(
      'test-azure-ad-id',
      expect.any(TransferPsosRequest)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });
});


