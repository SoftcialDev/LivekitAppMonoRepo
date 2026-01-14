import { Context } from '@azure/functions';
import { logWebPubSubErrorIfAny } from '../../src/utils/webPubSubErrorLogger';
import { ServiceContainer } from '../../src/infrastructure/container/ServiceContainer';
import { IErrorLogService } from '../../src/domain/interfaces/IErrorLogService';
import { WebSocketEventResponse, WebSocketEventRequest } from '../../src/domain/value-objects';
import { ErrorSeverity } from '../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../src/domain/enums/ErrorSource';
import { TestUtils } from '../setup';

const createMockWebSocketEventRequest = (
  userId: string = 'user-1',
  connectionId: string = 'conn-1',
  hub: string = 'test-hub',
  phase: string = 'connected'
): WebSocketEventRequest => {
  return new WebSocketEventRequest(userId, connectionId, hub, phase as any, {});
};

const createMockWebSocketEventResponse = (
  status: number,
  message: string
): WebSocketEventResponse => {
  return new WebSocketEventResponse(status, message);
};

describe('webPubSubErrorLogger', () => {
  let mockContext: Context;
  let mockServiceContainer: jest.Mocked<ServiceContainer>;
  let mockErrorLogService: jest.Mocked<IErrorLogService>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockErrorLogService = {
      logError: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockServiceContainer = {
      resolve: jest.fn().mockReturnValue(mockErrorLogService),
    } as any;

    jest.clearAllMocks();
  });

  describe('logWebPubSubErrorIfAny', () => {
    it('should not log when status is less than 400', async () => {
      const response = createMockWebSocketEventResponse(200, 'Success');
      const request = createMockWebSocketEventRequest();

      await logWebPubSubErrorIfAny(response, request, 'connect', mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).not.toHaveBeenCalled();
    });

    it('should log error when status is 400', async () => {
      const response = createMockWebSocketEventResponse(400, 'Bad request');
      const request = createMockWebSocketEventRequest();

      await logWebPubSubErrorIfAny(response, request, 'connect', mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith({
        severity: ErrorSeverity.Medium,
        source: ErrorSource.WebPubSub,
        endpoint: '/api/webpubsub-events',
        functionName: 'WebPubSubEvents',
        error: expect.any(Error),
        userId: 'user-1',
        httpStatusCode: 400,
        context: {
          eventName: 'connect',
          connectionId: 'conn-1',
          hub: 'test-hub',
          phase: 'connected',
        },
      });
    });

    it('should log error with Critical severity when status is 500', async () => {
      const response = createMockWebSocketEventResponse(500, 'Internal server error');
      const request = createMockWebSocketEventRequest('user-1', 'conn-1', 'test-hub', 'disconnected');

      await logWebPubSubErrorIfAny(response, request, 'disconnected', mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith({
        severity: ErrorSeverity.Critical,
        source: ErrorSource.WebPubSub,
        endpoint: '/api/webpubsub-events',
        functionName: 'WebPubSubEvents',
        error: expect.any(Error),
        userId: 'user-1',
        httpStatusCode: 500,
        context: {
          eventName: 'disconnected',
          connectionId: 'conn-1',
          hub: 'test-hub',
          phase: 'disconnected',
        },
      });
    });

    it('should use custom service name in context when provided', async () => {
      const response = createMockWebSocketEventResponse(400, 'Error');
      const request = createMockWebSocketEventRequest();

      await logWebPubSubErrorIfAny(
        response,
        request,
        'connect',
        mockServiceContainer,
        mockContext,
        { serviceName: 'CustomService' }
      );

      expect(mockContext.log.error).toHaveBeenCalled();
      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            service: 'CustomService',
          }),
        })
      );
    });

    it('should use custom endpoint and function name when provided', async () => {
      const response = createMockWebSocketEventResponse(400, 'Error');
      const request = createMockWebSocketEventRequest();

      await logWebPubSubErrorIfAny(
        response,
        request,
        'connect',
        mockServiceContainer,
        mockContext,
        { endpoint: '/api/custom', functionName: 'CustomFunction' }
      );

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/custom',
          functionName: 'CustomFunction',
        })
      );
    });

    it('should handle logging errors gracefully', async () => {
      const response = createMockWebSocketEventResponse(400, 'Error');
      const request = createMockWebSocketEventRequest();

      mockErrorLogService.logError.mockRejectedValue(new Error('Logging failed'));

      await logWebPubSubErrorIfAny(response, request, 'connect', mockServiceContainer, mockContext);

      expect(mockContext.log.warn).toHaveBeenCalledWith('Failed to log error', expect.any(Error));
    });
  });
});

