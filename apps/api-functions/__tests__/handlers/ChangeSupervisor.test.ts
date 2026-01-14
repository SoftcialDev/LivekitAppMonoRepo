import { Context } from '@azure/functions';
import { SupervisorApplicationService } from '../../src/application/services/SupervisorApplicationService';
import { SupervisorAssignment } from '../../src/domain/value-objects/SupervisorAssignment';
import { createMockContext, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { serviceContainer } from '../../src/infrastructure/container/ServiceContainer';

jest.mock('../../src/application/services/SupervisorApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  ...jest.requireActual('../../src/infrastructure/container/ServiceContainer'),
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}));

describe('ChangeSupervisor handler', () => {
  let mockContext: Context;
  let mockApplicationService: jest.Mocked<SupervisorApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();

    const jwtPayload = createMockJwtPayload({ roles: ['Admin'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        userEmails: ['pso1@example.com', 'pso2@example.com'],
        newSupervisorEmail: 'supervisor@example.com',
      },
    };

    mockApplicationService = {
      validateSupervisorAssignment: jest.fn(),
      changeSupervisor: jest.fn(),
    } as any;

    (SupervisorApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    mockResolve = (serviceContainer as any).resolve as jest.Mock;
    mockInitialize = (serviceContainer as any).initialize as jest.Mock;
    mockResolve.mockReturnValue({});
  });

  it('should successfully change supervisor', async () => {
    const mockResult = {
      updatedCount: 2,
      skippedCount: 0,
      totalProcessed: 2,
    };

    mockApplicationService.validateSupervisorAssignment.mockResolvedValue(undefined);
    mockApplicationService.changeSupervisor.mockResolvedValue(mockResult);

    const changeSupervisorHandler = (await import('../../src/handlers/ChangeSupervisor')).default;
    await changeSupervisorHandler(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(SupervisorApplicationService).toHaveBeenCalled();
    expect(mockApplicationService.validateSupervisorAssignment).toHaveBeenCalledWith(
      expect.any(SupervisorAssignment)
    );
    expect(mockApplicationService.changeSupervisor).toHaveBeenCalledWith(
      expect.any(SupervisorAssignment)
    );
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      updatedCount: 2,
      skippedCount: 0,
      totalProcessed: 2,
    });
  });

  it('should handle partial updates with skipped users', async () => {
    const mockResult = {
      updatedCount: 1,
      skippedCount: 1,
      totalProcessed: 2,
    };

    mockApplicationService.validateSupervisorAssignment.mockResolvedValue(undefined);
    mockApplicationService.changeSupervisor.mockResolvedValue(mockResult);

    const changeSupervisorHandler = (await import('../../src/handlers/ChangeSupervisor')).default;
    await changeSupervisorHandler(mockContext);

    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body.skippedCount).toBe(1);
  });
});

