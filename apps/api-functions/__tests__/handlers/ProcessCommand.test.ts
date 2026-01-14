import { Context } from '@azure/functions';
import { ProcessCommandApplicationService } from '../../src/application/services/ProcessCommandApplicationService';
import { ProcessCommandResponse } from '../../src/domain/value-objects/ProcessCommandResponse';
import { createMockContext } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/ProcessCommandApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

describe('ProcessCommand handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<ProcessCommandApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;
  let mockMessage: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();

    mockMessage = {
      command: 'START',
      employeeEmail: 'pso@example.com',
      timestamp: '2024-01-01T10:00:00.000Z',
      reason: 'Test reason',
    };

    mockApplicationService = {
      processCommand: jest.fn(),
    } as any;

    (ProcessCommandApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    const { container, mockResolve: resolve, mockInitialize: initialize } = createMockServiceContainer(mockApplicationService);
    mockResolve = resolve;
    mockInitialize = initialize;

    const { ServiceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    ServiceContainer.getInstance = jest.fn().mockReturnValue(container);
  });

  it('should successfully process command', async () => {
    const mockResponse = new ProcessCommandResponse('command-id-123', true, 'Command processed successfully');
    mockApplicationService.processCommand.mockResolvedValue(mockResponse);

    const processCommandHandler = (await import('../../src/handlers/ProcessCommand')).default;
    await processCommandHandler(mockContext, mockMessage);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('ProcessCommandApplicationService');
    expect(mockApplicationService.processCommand).toHaveBeenCalled();
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Command START for pso@example.com processed')
    );
  });

  it('should handle STOP command', async () => {
    mockMessage = {
      command: 'STOP',
      employeeEmail: 'pso@example.com',
      timestamp: '2024-01-01T10:00:00.000Z',
    };

    const mockResponse = new ProcessCommandResponse('command-id-456', false, 'Command queued');
    mockApplicationService.processCommand.mockResolvedValue(mockResponse);

    const processCommandHandler = (await import('../../src/handlers/ProcessCommand')).default;
    await processCommandHandler(mockContext, mockMessage);

    expect(mockApplicationService.processCommand).toHaveBeenCalled();
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Command STOP for pso@example.com processed')
    );
  });

  it('should throw error on processing failure', async () => {
    const error = new Error('Processing failed');
    mockApplicationService.processCommand.mockRejectedValue(error);

    const processCommandHandler = (await import('../../src/handlers/ProcessCommand')).default;
    
    await expect(processCommandHandler(mockContext, mockMessage)).rejects.toThrow('Processing failed');
    expect(mockContext.log.error).toHaveBeenCalledWith('Error in ProcessCommand:', error);
  });
});

