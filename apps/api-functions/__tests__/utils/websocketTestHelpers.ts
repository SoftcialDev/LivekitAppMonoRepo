/**
 * @fileoverview WebSocket test helpers
 * @summary Shared utilities for WebSocket handler unit tests
 * @description Common test setup and assertions for WebSocket connection handlers
 */

import { Context } from '@azure/functions';
import { TestHelpers } from './helpers';
import { mockServiceContainer as createServiceContainerMock } from '../mocks/container';
import { toPayloadify } from '../mocks/payload';

export interface WebSocketTestSetup {
  ctx: Context;
  container: { initialize: jest.Mock; resolve: jest.Mock };
  appService: any;
}

export interface WebSocketDisconnectionTestSetup {
  ctx: Context;
  container: { initialize: jest.Mock; resolve: jest.Mock };
  connectionService: any;
  cmService: any;
  webPubSubService: any;
}

/**
 * Sets up common WebSocket connection test environment
 * @param bindingData - Optional binding data to override defaults
 * @returns Test setup with mocked dependencies
 */
export function setupWebSocketConnectionTest(bindingData: any = {}): WebSocketTestSetup {
  const ctx = TestHelpers.createMockContext();
  ctx.bindingData = {
    invocationId: 'inv-123',
    userId: 'user-123',
    connectionId: 'conn-456',
    hub: 'test-hub',
    phase: 'connected',
    ...bindingData
  };

  const appService = { handleConnection: jest.fn() };
  const container = createServiceContainerMock({ WebSocketConnectionApplicationService: appService });
  container.resolve.mockReturnValue(appService);

  return { ctx, container, appService };
}

/**
 * Sets up common WebSocket disconnection test environment
 * @param bindingData - Optional binding data to override defaults
 * @returns Test setup with mocked dependencies
 */
export function setupWebSocketDisconnectionTest(bindingData: any = {}): WebSocketDisconnectionTestSetup {
  const ctx = TestHelpers.createMockContext();
  ctx.log = jest.fn() as any;
  ctx.log.error = jest.fn();
  ctx.bindingData = {
    invocationId: 'inv-123',
    userId: 'user-123',
    connectionId: 'conn-456',
    hub: 'test-hub',
    phase: 'disconnected',
    ...bindingData
  };

  const connectionService = { handleDisconnection: jest.fn() };
  const cmService = { handleContactManagerDisconnect: jest.fn() };
  const webPubSubService = { syncAllUsersWithDatabase: jest.fn() };
  
  const container = createServiceContainerMock({ 
    WebSocketConnectionApplicationService: connectionService,
    ContactManagerDisconnectApplicationService: cmService,
    WebPubSubService: webPubSubService
  });
  container.resolve.mockImplementation((serviceName: string) => {
    if (serviceName === 'WebSocketConnectionApplicationService') return connectionService;
    if (serviceName === 'ContactManagerDisconnectApplicationService') return cmService;
    if (serviceName === 'WebPubSubService') return webPubSubService;
    return null;
  });

  return { ctx, container, connectionService, cmService, webPubSubService };
}

/**
 * Common assertions for WebSocket connection success
 * @param appService - Mocked application service
 * @param container - Mocked service container
 * @param ctx - Test context
 * @param expectedStatus - Expected response status
 */
export function assertWebSocketConnectionSuccess(
  appService: any,
  container: { initialize: jest.Mock; resolve: jest.Mock },
  ctx: Context,
  expectedStatus: number = 200
) {
  expect(container.initialize).toHaveBeenCalled();
  expect(container.resolve).toHaveBeenCalledWith('WebSocketConnectionApplicationService');
  expect(appService.handleConnection).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: expect.any(String),
      connectionId: expect.any(String),
      hub: expect.any(String),
      phase: expect.any(String)
    })
  );
  expect(ctx.res).toEqual({ status: expectedStatus });
}

/**
 * Common assertions for WebSocket disconnection success
 * @param connectionService - Mocked connection service
 * @param cmService - Mocked contact manager service
 * @param webPubSubService - Mocked web pub sub service
 * @param container - Mocked service container
 * @param ctx - Test context
 * @param expectedStatus - Expected response status
 */
export function assertWebSocketDisconnectionSuccess(
  connectionService: any,
  cmService: any,
  webPubSubService: any,
  container: { initialize: jest.Mock; resolve: jest.Mock },
  ctx: Context,
  expectedStatus: number = 200
) {
  expect(container.initialize).toHaveBeenCalled();
  expect(container.resolve).toHaveBeenCalledWith('WebSocketConnectionApplicationService');
  expect(container.resolve).toHaveBeenCalledWith('ContactManagerDisconnectApplicationService');
  expect(container.resolve).toHaveBeenCalledWith('WebPubSubService');
  
  expect(connectionService.handleDisconnection).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: expect.any(String),
      connectionId: expect.any(String),
      hub: expect.any(String),
      phase: expect.any(String)
    }),
    ctx
  );
  expect(cmService.handleContactManagerDisconnect).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: expect.any(String),
      connectionId: expect.any(String),
      hub: expect.any(String),
      phase: expect.any(String)
    })
  );
  expect(webPubSubService.syncAllUsersWithDatabase).toHaveBeenCalled();
  expect(ctx.res).toEqual({ status: expectedStatus });
}

/**
 * Common assertions for error handling
 * @param ctx - Test context
 * @param expectedStatus - Expected error status
 * @param expectedMessage - Expected error message pattern
 */
export function assertWebSocketError(
  ctx: Context,
  expectedStatus: number = 500,
  expectedMessage?: string
) {
  expect(ctx.res?.status).toBe(expectedStatus);
  if (expectedMessage) {
    expect(ctx.res?.body).toBe(expectedMessage);
  } else {
    expect(ctx.res?.body).toMatch(/Internal error:/);
  }
}
