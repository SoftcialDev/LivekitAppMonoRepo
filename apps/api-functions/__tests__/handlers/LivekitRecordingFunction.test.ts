import { Context, HttpRequest } from '@azure/functions';
import { LivekitRecordingApplicationService } from '../../src/application/services/LivekitRecordingApplicationService';
import { LivekitRecordingResponse } from '../../src/domain/value-objects/LivekitRecordingResponse';
import { RecordingCommandType } from '@prisma/client';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/LivekitRecordingApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}), { virtual: true });

describe('LivekitRecordingFunction handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<LivekitRecordingApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });

    const jwtPayload = createMockJwtPayload({ roles: ['SuperAdmin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        command: RecordingCommandType.START,
        roomName: 'room-123',
      },
    };

    mockApplicationService = {
      processRecordingCommand: jest.fn(),
    } as any;

    (LivekitRecordingApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    const { serviceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully start recording', async () => {
    const mockResponse = LivekitRecordingResponse.forStartCommand(
      'Recording started successfully',
      'room-123',
      'egress-id-123',
      'blob/path/123'
    );
    mockApplicationService.processRecordingCommand.mockResolvedValue(mockResponse);

    const livekitRecordingHandler = (await import('../../src/handlers/LivekitRecordingFunction')).default;
    await livekitRecordingHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('LivekitRecordingApplicationService');
    expect(mockApplicationService.processRecordingCommand).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual(mockResponse.toPayload());
  });

  it('should successfully stop recording', async () => {
    mockContext.bindings.validatedBody = {
      command: RecordingCommandType.STOP,
      roomName: 'room-123',
    };

    const mockResponse = LivekitRecordingResponse.forStopCommand(
      'Recording stopped successfully',
      'room-123',
      [],
      'https://example.com/sas-url'
    );
    mockApplicationService.processRecordingCommand.mockResolvedValue(mockResponse);

    const livekitRecordingHandler = (await import('../../src/handlers/LivekitRecordingFunction')).default;
    await livekitRecordingHandler(mockContext, mockRequest);

    expect(mockApplicationService.processRecordingCommand).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });
});

