/**
 * @fileoverview Tests for CameraFailureApplicationService
 * @description Tests for camera failure application service
 */

import { CameraFailureApplicationService } from '../../../../shared/application/services/CameraFailureApplicationService';
import { ICameraStartFailureRepository } from '../../../../shared/domain/interfaces/ICameraStartFailureRepository';
import { CameraStartFailureRequest } from '../../../../shared/domain/schemas/CameraStartFailureSchema';
import { CameraFailureReport } from '../../../../shared/domain/value-objects/CameraFailureReport';
// Define the enum values as strings for better test compatibility
const CameraFailureStage = {
  Permission: 'Permission',
  Enumerate: 'Enumerate',
  TrackCreate: 'TrackCreate',
  LiveKitConnect: 'LiveKitConnect',
  Publish: 'Publish',
  Unknown: 'Unknown'
} as const;

// Mock dependencies
jest.mock('../../../../shared/domain/value-objects/CameraFailureReport');

describe('CameraFailureApplicationService', () => {
  let cameraFailureApplicationService: CameraFailureApplicationService;
  let mockRepository: jest.Mocked<ICameraStartFailureRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
    } as any;

    cameraFailureApplicationService = new CameraFailureApplicationService(mockRepository);
  });

  describe('constructor', () => {
    it('should create CameraFailureApplicationService instance', () => {
      expect(cameraFailureApplicationService).toBeInstanceOf(CameraFailureApplicationService);
    });
  });

  describe('logStartFailure', () => {
    it('should log camera start failure successfully', async () => {
      const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
        userAdId: 'user-123',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Permission,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        deviceCount: 1,
        devicesSnapshot: [{ label: 'Camera 1', deviceId: 'device-1' }],
        attempts: [{ result: 'FAILED' as any, errorName: 'PermissionError' }],
        metadata: { browser: 'Chrome' },
      };

      const mockReport = {
        toPersistence: jest.fn().mockReturnValue({
          userAdId: 'user-123',
          userEmail: 'test@example.com',
          stage: 'Permission',
          errorName: 'PermissionError',
          errorMessage: 'Camera permission denied',
          deviceCount: 1,
          devicesSnapshot: [{ id: 'device-1', name: 'Camera 1' }],
          attempts: [{ attempt: 1, success: false }],
          metadata: { browser: 'Chrome' },
        }),
      };

      (CameraFailureReport.fromRequest as jest.Mock).mockReturnValue(mockReport);
      mockRepository.create.mockResolvedValue(undefined);

      await cameraFailureApplicationService.logStartFailure(input);

      expect(CameraFailureReport.fromRequest).toHaveBeenCalledWith(input);
      expect(mockReport.toPersistence).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should log camera start failure with minimal data', async () => {
      const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
        userAdId: 'user-456',
        userEmail: 'minimal@example.com',
        stage: CameraFailureStage.Enumerate,
        errorName: 'DeviceNotFoundError',
        errorMessage: 'No camera devices found',
      };

      const mockReport = {
        toPersistence: jest.fn().mockReturnValue({
          userAdId: 'user-456',
          userEmail: 'minimal@example.com',
          stage: 'Enumerate',
          errorName: 'DeviceNotFoundError',
          errorMessage: 'No camera devices found',
        }),
      };

      (CameraFailureReport.fromRequest as jest.Mock).mockReturnValue(mockReport);
      mockRepository.create.mockResolvedValue(undefined);

      await cameraFailureApplicationService.logStartFailure(input);

      expect(CameraFailureReport.fromRequest).toHaveBeenCalledWith(input);
      expect(mockReport.toPersistence).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle different camera failure stages', async () => {
      const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
        userAdId: 'user-789',
        userEmail: 'stage@example.com',
        stage: CameraFailureStage.LiveKitConnect,
        errorName: 'ConnectionFailed',
        errorMessage: 'Failed to connect to LiveKit',
      };

      const mockReport = {
        toPersistence: jest.fn().mockReturnValue({
          userAdId: 'user-789',
          userEmail: 'stage@example.com',
          stage: 'LiveKitConnect',
          errorName: 'ConnectionFailed',
          errorMessage: 'Failed to connect to LiveKit',
        }),
      };

      (CameraFailureReport.fromRequest as jest.Mock).mockReturnValue(mockReport);
      mockRepository.create.mockResolvedValue(undefined);

      await cameraFailureApplicationService.logStartFailure(input);

      expect(CameraFailureReport.fromRequest).toHaveBeenCalledWith(input);
      expect(mockReport.toPersistence).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle repository errors', async () => {
      const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
        userAdId: 'user-error',
        userEmail: 'error@example.com',
        stage: CameraFailureStage.Permission,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
      };

      const mockReport = {
        toPersistence: jest.fn().mockReturnValue({
          userAdId: 'user-error',
          userEmail: 'error@example.com',
          stage: 'Permission',
          errorName: 'PermissionError',
          errorMessage: 'Camera permission denied',
        }),
      };

      (CameraFailureReport.fromRequest as jest.Mock).mockReturnValue(mockReport);
      const repositoryError = new Error('Database connection failed');
      mockRepository.create.mockRejectedValue(repositoryError);

      await expect(cameraFailureApplicationService.logStartFailure(input))
        .rejects.toThrow('Database connection failed');

      expect(CameraFailureReport.fromRequest).toHaveBeenCalledWith(input);
      expect(mockReport.toPersistence).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });
});
