/**
 * @fileoverview WebPubSubToken Handler Unit Test
 * @summary Unit tests for WebPubSubToken Azure Function handler
 * @description Tests the handler in isolation with mocked dependencies
 */

import { Context, HttpRequest } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import { mockServiceContainer as createServiceContainerMock } from '../../mocks/container';
import { toPayloadify } from '../../mocks/payload';

async function runWebPubSubTokenHandler(ctx: Context, req: HttpRequest) {
  const handler = (await import('../../../WebPubSubToken/index')).default;
  return handler(ctx, req);
}

describe('WebPubSubToken Handler Unit Tests', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let serviceContainerMock: any;
  let mockApplicationService: any;

  beforeEach(() => {
    jest.resetModules();
    mockContext = TestHelpers.createMockContext();
    mockRequest = TestHelpers.createMockHttpRequest();

    // Mock the application service
    mockApplicationService = {
      generateToken: jest.fn()
    };

    // Mock the service container
    serviceContainerMock = createServiceContainerMock({ WebPubSubTokenApplicationService: mockApplicationService });
    serviceContainerMock.resolve.mockReturnValue(mockApplicationService);
  });

  it('should execute handler successfully with valid request', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const mockResponse = TestHelpers.createMockWebPubSubResponse();

    mockApplicationService.generateToken.mockResolvedValue(
      toPayloadify({
        token: mockResponse.token,
        endpoint: mockResponse.endpoint,
        hubName: mockResponse.hubName,
        groups: mockResponse.groups
      })
    );

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(serviceContainerMock.initialize).toHaveBeenCalled();
    expect(serviceContainerMock.resolve).toHaveBeenCalledWith('WebPubSubTokenApplicationService');
    expect(mockApplicationService.generateToken).toHaveBeenCalledWith(
      callerId,
      expect.objectContaining({ callerId: callerId })
    );
    expect(mockContext.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: mockResponse
    });
  });

  it('should handle application service errors', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const error = new Error('Application service error');

    mockApplicationService.generateToken.mockRejectedValue(error);

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res?.status).toBe(500);
    expect(mockContext.res?.body).toEqual({ error: 'Internal error issuing Web PubSub token' });
    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Application service error' }),
      'Unhandled exception in function'
    );
  });

  it('should handle missing caller ID', async () => {
    // Arrange
    mockContext.bindings.callerId = undefined;
    const mockResponse = TestHelpers.createMockWebPubSubResponse();

    mockApplicationService.generateToken.mockResolvedValue(
      toPayloadify({
        token: mockResponse.token,
        endpoint: mockResponse.endpoint,
        hubName: mockResponse.hubName,
        groups: mockResponse.groups
      })
    );

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockApplicationService.generateToken).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ callerId: undefined })
    );
  });

  it('should create WebPubSubTokenRequest with correct caller ID', async () => {
    // Arrange
    const callerId = 'test-caller-id-123';
    mockContext.bindings.callerId = callerId;
    const mockResponse = TestHelpers.createMockWebPubSubResponse();

    mockApplicationService.generateToken.mockResolvedValue(
      toPayloadify({
        token: mockResponse.token,
        endpoint: mockResponse.endpoint,
        hubName: mockResponse.hubName,
        groups: mockResponse.groups
      })
    );

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockApplicationService.generateToken).toHaveBeenCalledWith(
      callerId,
      expect.objectContaining({ callerId: callerId })
    );
  });

  it('should return correct response structure', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const mockResponse = TestHelpers.createMockWebPubSubResponse();

    mockApplicationService.generateToken.mockResolvedValue(
      toPayloadify({
        token: mockResponse.token,
        endpoint: mockResponse.endpoint,
        hubName: mockResponse.hubName,
        groups: mockResponse.groups
      })
    );

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        token: mockResponse.token,
        endpoint: mockResponse.endpoint,
        hubName: mockResponse.hubName,
        groups: mockResponse.groups
      }
    });
  });

  it('should handle different response data structures', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const customResponse = {
      token: 'custom-jwt-token',
      endpoint: 'https://custom.webpubsub.azure.com',
      hubName: 'custom-hub',
      groups: ['presence', 'admin', 'custom-group']
    };

    mockApplicationService.generateToken.mockResolvedValue(toPayloadify(customResponse));

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: customResponse
    });
  });

  it('should handle empty groups array', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const responseWithEmptyGroups = {
      token: 'token-with-empty-groups',
      endpoint: 'https://test.webpubsub.azure.com',
      hubName: 'test-hub',
      groups: []
    };

    mockApplicationService.generateToken.mockResolvedValue(toPayloadify(responseWithEmptyGroups));

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: responseWithEmptyGroups
    });
  });

  it('should handle service container initialization errors', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const error = new Error('Service container initialization failed');

    serviceContainerMock.initialize.mockImplementation(() => {
      throw error;
    });

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res?.status).toBe(500);
    expect(mockContext.res?.body).toEqual({ error: 'Internal error issuing Web PubSub token' });
    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Service container initialization failed' }),
      'Unhandled exception in function'
    );
  });

  it('should handle service resolution errors', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const error = new Error('Service resolution failed');
    serviceContainerMock.resolve.mockImplementation(() => { throw error; });

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res?.status).toBe(500);
    expect(mockContext.res?.body).toEqual({ error: 'Internal error issuing Web PubSub token' });
    expect(mockContext.log.error).toHaveBeenCalledTimes(1);
  });

  it('should handle different error types', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;
    const customError = new Error('Custom business logic error');

    mockApplicationService.generateToken.mockRejectedValue(customError);

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res?.status).toBe(500);
    expect(mockContext.res?.body).toEqual({ error: 'Internal error issuing Web PubSub token' });
    expect(mockContext.log.error).toHaveBeenCalledTimes(1);
  });

  it('should handle null response from application service', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;

    mockApplicationService.generateToken.mockResolvedValue(toPayloadify(null));

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(mockContext.res?.body).toBeNull();
  });

  it('should handle undefined response from application service', async () => {
    // Arrange
    const callerId = TestHelpers.generateUuid();
    mockContext.bindings.callerId = callerId;

    mockApplicationService.generateToken.mockResolvedValue(toPayloadify(undefined));

    // Act
    await runWebPubSubTokenHandler(mockContext, mockRequest);

    // Assert
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(mockContext.res?.body).toBeUndefined();
  });
});