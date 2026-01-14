import { Context } from '@azure/functions';
import { CommandAcknowledgmentApplicationService } from '../../src/application/services/CommandAcknowledgmentApplicationService';
import { AcknowledgeCommandRequest } from '../../src/domain/value-objects/AcknowledgeCommandRequest';
import { createMockContext, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ...jest.requireActual('../../src/infrastructure/container/ServiceContainer'),
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('AcknowledgeCommandFunction handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<CommandAcknowledgmentApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        ids: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
      },
    };

    mockApplicationService = {
      acknowledgeCommands: jest.fn(),
    } as any;

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully acknowledge commands', async () => {
    const mockResponse = {
      updatedCount: 2,
      toPayload: jest.fn().mockReturnValue({
        updatedCount: 2,
      }),
    };

    mockApplicationService.acknowledgeCommands.mockResolvedValue(mockResponse as any);

    const acknowledgeCommandHandler = (await import('../../src/handlers/AcknowledgeCommandFunction')).default;
    await acknowledgeCommandHandler(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('CommandAcknowledgmentApplicationService');
    expect(mockApplicationService.acknowledgeCommands).toHaveBeenCalledWith(
      expect.any(AcknowledgeCommandRequest),
      'test-azure-ad-id'
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.updatedCount).toBe(2);
  });

  it('should handle single command id', async () => {
    mockContext.bindings.validatedBody = {
      ids: ['123e4567-e89b-12d3-a456-426614174000'],
    };

    const mockResponse = {
      updatedCount: 1,
      toPayload: jest.fn().mockReturnValue({
        updatedCount: 1,
      }),
    };

    mockApplicationService.acknowledgeCommands.mockResolvedValue(mockResponse as any);

    const acknowledgeCommandHandler = (await import('../../src/handlers/AcknowledgeCommandFunction')).default;
    await acknowledgeCommandHandler(mockContext);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.updatedCount).toBe(1);
  });
});

