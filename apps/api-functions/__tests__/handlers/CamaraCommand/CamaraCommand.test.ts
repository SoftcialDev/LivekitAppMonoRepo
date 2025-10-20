/**
 * @fileoverview CamaraCommand handler - unit tests
 * @summary Unit tests using shared mocks and isolated DI container
 */

import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';
import '../../mocks/middleware';
import '../../mocks/response';

async function runHandler(ctx: Context) {
  const handler = (await import('../../../CamaraCommand/index')).default;
  return handler(ctx);
}

describe('CamaraCommand handler - unit', () => {
  let ctx: Context;
  let container: { initialize: jest.Mock; resolve: jest.Mock };
  let services: Record<string, any>;

  beforeEach(() => {
    jest.resetModules();
    require('../../mocks/middleware');
    require('../../mocks/response');

    ctx = TestHelpers.createMockContext();
    (ctx as any).req = { method: 'POST', body: { command: 'START', employeeEmail: 'e@example.com', reason: 'test' } } as any;
    (ctx as any).bindings = { user: { id: 'caller' } } as any;

    services = {
      userRepository: {},
      authorizationService: {},
      commandMessagingService: { sendAdminCommand: jest.fn() },
      webPubSubService: { broadcastAdminCommand: jest.fn() }
    };

    const initialize = jest.fn();
    const resolve = jest.fn((token: string) => {
      if (token === 'UserRepository') return services.userRepository;
      if (token === 'AuthorizationService') return services.authorizationService;
      if (token === 'CommandMessagingService') return services.commandMessagingService;
      if (token === 'WebPubSubService') return services.webPubSubService;
      return null;
    });
    container = { initialize, resolve } as any;

    jest.doMock('../../../shared/infrastructure/container/ServiceContainer', () => ({
      serviceContainer: { initialize, resolve }
    }));

    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => 'ad-123' }));

    jest.doMock('../../../shared/domain/value-objects/Command', () => ({
      Command: { fromRequest: (x: any) => x }
    }));

    jest.doMock('../../../shared/domain/enums/MessagingChannel', () => ({
      MessagingChannel: { WebSocket: 'ws', ServiceBus: 'bus' }
    }));

    const authorizeCommandSender = jest.fn().mockResolvedValue(undefined);
    const validateTargetEmployee = jest.fn().mockResolvedValue(undefined);
    const sendCameraCommand = jest.fn();

    jest.doMock('../../../shared/application/services/CommandApplicationService', () => ({
      CommandApplicationService: jest.fn().mockImplementation(() => ({
        authorizeCommandSender,
        validateTargetEmployee,
        sendCameraCommand
      }))
    }));
  });

  it('should return 200 when sent via WebSocket', async () => {
    const { CommandApplicationService } = await import('../../../shared/application/services/CommandApplicationService');
    (CommandApplicationService as jest.Mock).mockImplementation(() => ({
      authorizeCommandSender: jest.fn().mockResolvedValue(undefined),
      validateTargetEmployee: jest.fn().mockResolvedValue(undefined),
      sendCameraCommand: jest.fn().mockResolvedValue({ sentVia: 'ws' })
    }));

    await runHandler(ctx);
    expect(container.initialize).toHaveBeenCalled();
    expect(container.resolve).toHaveBeenCalledWith('WebPubSubService');
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({ sentVia: 'ws' });
  });

  it('should return 200 when sent via Service Bus fallback', async () => {
    const { CommandApplicationService } = await import('../../../shared/application/services/CommandApplicationService');
    (CommandApplicationService as jest.Mock).mockImplementation(() => ({
      authorizeCommandSender: jest.fn().mockResolvedValue(undefined),
      validateTargetEmployee: jest.fn().mockResolvedValue(undefined),
      sendCameraCommand: jest.fn().mockResolvedValue({ sentVia: 'bus' })
    }));

    await runHandler(ctx);
    expect(ctx.res?.status).toBe(200);
    expect(ctx.res?.body).toMatchObject({ sentVia: 'bus' });
  });

  it('should return 401 when caller id missing', async () => {
    jest.doMock('../../../shared/utils/authHelpers', () => ({ getCallerAdId: () => undefined }));
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(401);
  });

  it('should return 500 when initialize throws', async () => {
    (container.initialize as jest.Mock).mockImplementation(() => { throw new Error('init failed'); });
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error' });
  });

  it('should return 500 when resolve throws', async () => {
    (container.resolve as jest.Mock).mockImplementation(() => { throw new Error('resolve failed'); });
    await runHandler(ctx);
    expect(ctx.res?.status).toBe(500);
    expect(ctx.res?.body).toEqual({ error: 'Internal error' });
  });
});


