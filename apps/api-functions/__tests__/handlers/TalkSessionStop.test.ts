import { Context, HttpRequest } from '@azure/functions';
import { TalkSessionApplicationService } from '../../src/application/services/TalkSessionApplicationService';
import { TalkSessionStopResponse } from '../../src/domain/value-objects/TalkSessionStopResponse';
import { TalkStopReason } from '../../src/domain/enums/TalkStopReason';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/TalkSessionApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

describe('TalkSessionStop handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<TalkSessionApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        talkSessionId: '550e8400-e29b-41d4-a716-446655440000',
        stopReason: TalkStopReason.USER_STOP,
      },
    };

    mockApplicationService = {
      stopTalkSession: jest.fn(),
    } as any;

    (TalkSessionApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully stop talk session', async () => {
    const mockResponse = new TalkSessionStopResponse('Talk session stopped successfully');
    mockApplicationService.stopTalkSession.mockResolvedValue(mockResponse);

    const talkSessionStopHandler = (await import('../../src/handlers/TalkSessionStop')).default;
    await talkSessionStopHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('TalkSessionApplicationService');
    expect(mockApplicationService.stopTalkSession).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should handle different stop reasons', async () => {
    mockContext.bindings.validatedBody = {
      talkSessionId: '550e8400-e29b-41d4-a716-446655440000',
      stopReason: TalkStopReason.PSO_DISCONNECTED,
    };

    const mockResponse = new TalkSessionStopResponse('Talk session cancelled successfully');
    mockApplicationService.stopTalkSession.mockResolvedValue(mockResponse);

    const talkSessionStopHandler = (await import('../../src/handlers/TalkSessionStop')).default;
    await talkSessionStopHandler(mockContext, mockRequest);

    expect(mockApplicationService.stopTalkSession).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });
});

