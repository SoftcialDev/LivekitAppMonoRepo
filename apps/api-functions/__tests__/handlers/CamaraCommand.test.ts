import { Context } from '@azure/functions';
import { CommandApplicationService } from '../../src/application/services/CommandApplicationService';
import { Command } from '../../src/domain/value-objects/Command';
import { MessagingChannel } from '../../src/domain/enums/MessagingChannel';
import { CommandType } from '../../src/domain/enums/CommandType';
import { createMockContext, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/application/services/CommandApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ...jest.requireActual('../../src/infrastructure/container/ServiceContainer'),
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('CamaraCommand handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<CommandApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();

    const jwtPayload = createMockJwtPayload({ roles: ['Supervisor'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        command: CommandType.START,
        employeeEmail: 'pso@example.com',
        reason: 'Test reason',
      },
    };

    mockApplicationService = {
      validateTargetPSO: jest.fn(),
      sendCameraCommand: jest.fn(),
    } as any;

    (CommandApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue({});
  });

  it('should successfully send camera command via WebSocket', async () => {
    mockApplicationService.validateTargetPSO.mockResolvedValue(undefined);
    mockApplicationService.sendCameraCommand.mockResolvedValue({
      sentVia: MessagingChannel.WebSocket,
      success: true,
    });

    const camaraCommandHandler = (await import('../../src/handlers/CamaraCommand')).default;
    await camaraCommandHandler(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(CommandApplicationService).toHaveBeenCalled();
    expect(mockApplicationService.validateTargetPSO).toHaveBeenCalledWith('pso@example.com');
    expect(mockApplicationService.sendCameraCommand).toHaveBeenCalledWith(
      expect.any(Command)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.sentVia).toBe(MessagingChannel.WebSocket);
  });

  it('should successfully send camera command via Service Bus', async () => {
    mockApplicationService.validateTargetPSO.mockResolvedValue(undefined);
    mockApplicationService.sendCameraCommand.mockResolvedValue({
      sentVia: MessagingChannel.ServiceBus,
      success: true,
    });

    const camaraCommandHandler = (await import('../../src/handlers/CamaraCommand')).default;
    await camaraCommandHandler(mockContext);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.sentVia).toBe(MessagingChannel.ServiceBus);
  });
});

