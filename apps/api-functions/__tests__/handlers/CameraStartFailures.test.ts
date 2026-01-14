import { Context } from '@azure/functions';
import { ICameraFailureService } from '../../src/domain/interfaces/ICameraFailureService';
import { CameraFailureStage } from '@prisma/client';
import { AttemptResult } from '../../src/domain/enums/AttemptResult';
import { createMockContext, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks } from './handlerTestSetup';
import { CallerIdNotFoundError } from '../../src/domain/errors/MiddlewareErrors';

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}), { virtual: true });

describe('CameraStartFailures handler', () => {
  let mockContext: Context;
  let mockFailureService: jest.Mocked<ICameraFailureService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockContext.bindingData = {
      invocationId: 'test-invocation-id',
    };

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'], upn: 'test@example.com' });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        stage: CameraFailureStage.Permission,
        errorName: 'NotAllowedError',
        errorMessage: 'Permission denied',
        deviceCount: 2,
        devicesSnapshot: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
            groupId: 'group-1',
          },
        ],
        attempts: [
          {
            label: 'Camera 1',
            deviceId: 'device-1',
            result: AttemptResult.Other,
            errorName: 'NotAllowedError',
            errorMessage: 'Permission denied',
          },
        ],
      },
    };

    mockFailureService = {
      logStartFailure: jest.fn().mockResolvedValue(undefined),
    } as any;

    const { serviceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;
    mockResolve.mockReturnValue(mockFailureService);
  });

  it('should successfully log camera start failure', async () => {
    const cameraStartFailuresHandler = (await import('../../src/handlers/CameraStartFailures')).default;
    await cameraStartFailuresHandler(mockContext);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('CameraFailureService');
    expect(mockFailureService.logStartFailure).toHaveBeenCalledWith({
      userAdId: 'test-azure-ad-id',
      userEmail: 'test@example.com',
      stage: CameraFailureStage.Permission,
      errorName: 'NotAllowedError',
      errorMessage: 'Permission denied',
      deviceCount: 2,
      devicesSnapshot: expect.any(Array),
      attempts: expect.any(Array),
    });
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({ stored: true });
  });

  it('should throw CallerIdNotFoundError when userAdId is missing', async () => {
    const jwtPayload = createMockJwtPayload({ oid: undefined });
    mockContext.bindings.user = jwtPayload;

    const cameraStartFailuresHandler = (await import('../../src/handlers/CameraStartFailures')).default;
    
    await expect(cameraStartFailuresHandler(mockContext)).rejects.toThrow(CallerIdNotFoundError);
  });
});

