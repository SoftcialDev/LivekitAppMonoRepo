/**
 * @fileoverview Tests for CameraStartFailureRepository
 * @description Tests for camera start failure repository
 */

import { CameraStartFailureRepository } from '../../../../shared/infrastructure/repositories/CameraStartFailureRepository';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  user: {
    findUnique: jest.fn(),
  },
  cameraStartFailure: {
    create: jest.fn(),
  },
}));

const mockPrisma = prisma as any;

describe('CameraStartFailureRepository', () => {
  let repository: CameraStartFailureRepository;

  beforeEach(() => {
    repository = new CameraStartFailureRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create camera start failure with user ID when user exists', async () => {
      const data = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: 'Permission' as any,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        deviceCount: 2,
        devicesSnapshot: [{ id: 'device1', name: 'Camera 1' }],
        attempts: [{ attempt: 1, success: false }],
        metadata: { browser: 'Chrome', version: '1.0.0' },
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as any);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { azureAdObjectId: 'test-user-id' },
        select: { id: true },
      });

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
          stage: 'Permission' as any,
          errorName: 'PermissionError',
          errorMessage: 'Camera permission denied',
          deviceCount: 2,
          devicesSnapshot: [{ id: 'device1', name: 'Camera 1' }],
          attempts: [{ attempt: 1, success: false }],
          metadata: { browser: 'Chrome', version: '1.0.0' },
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should create camera start failure without user ID when user does not exist', async () => {
      const data = {
        userAdId: 'non-existent-user',
        userEmail: 'test@example.com',
        stage: 'Permission' as any,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        deviceCount: undefined,
        devicesSnapshot: undefined,
        attempts: undefined,
        metadata: undefined,
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { azureAdObjectId: 'non-existent-user' },
        select: { id: true },
      });

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          userAdId: 'non-existent-user',
          userEmail: 'test@example.com',
          stage: 'Permission' as any,
          errorName: 'PermissionError',
          errorMessage: 'Camera permission denied',
          deviceCount: undefined,
          devicesSnapshot: undefined,
          attempts: undefined,
          metadata: undefined,
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should handle minimal data', async () => {
      const data = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: 'Permission' as any,
        errorName: 'PermissionError',
        errorMessage: 'Camera permission denied',
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as any);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
          stage: 'Permission' as any,
          errorName: 'PermissionError',
          errorMessage: 'Camera permission denied',
          deviceCount: undefined,
          devicesSnapshot: undefined,
          attempts: undefined,
          metadata: undefined,
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should handle different stages', async () => {
      const data = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: 'Enumerate' as any,
        errorName: 'EnumerateError',
        errorMessage: 'Failed to enumerate devices',
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as any);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
          stage: 'Enumerate' as any,
          errorName: 'EnumerateError',
          errorMessage: 'Failed to enumerate devices',
          deviceCount: undefined,
          devicesSnapshot: undefined,
          attempts: undefined,
          metadata: undefined,
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should handle complex devices snapshot', async () => {
      const data = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: 'TrackCreate' as any,
        errorName: 'TrackCreateError',
        errorMessage: 'Failed to create track',
        devicesSnapshot: [
          { id: 'device1', name: 'Camera 1', capabilities: ['video', 'audio'] },
          { id: 'device2', name: 'Camera 2', capabilities: ['video'] },
        ],
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as any);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
          stage: 'TrackCreate' as any,
          errorName: 'TrackCreateError',
          errorMessage: 'Failed to create track',
          deviceCount: undefined,
          devicesSnapshot: [
            { id: 'device1', name: 'Camera 1', capabilities: ['video', 'audio'] },
            { id: 'device2', name: 'Camera 2', capabilities: ['video'] },
          ],
          attempts: undefined,
          metadata: undefined,
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should handle complex attempts data', async () => {
      const data = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: 'LiveKitConnect' as any,
        errorName: 'LiveKitConnectError',
        errorMessage: 'Failed to connect to LiveKit',
        attempts: [
          { attempt: 1, success: false, error: 'Connection timeout' },
          { attempt: 2, success: false, error: 'Authentication failed' },
          { attempt: 3, success: true },
        ],
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as any);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
          stage: 'LiveKitConnect' as any,
          errorName: 'LiveKitConnectError',
          errorMessage: 'Failed to connect to LiveKit',
          deviceCount: undefined,
          devicesSnapshot: undefined,
          attempts: [
            { attempt: 1, success: false, error: 'Connection timeout' },
            { attempt: 2, success: false, error: 'Authentication failed' },
            { attempt: 3, success: true },
          ],
          metadata: undefined,
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });

    it('should handle complex metadata', async () => {
      const data = {
        userAdId: 'test-user-id',
        userEmail: 'test@example.com',
        stage: 'Publish' as any,
        errorName: 'PublishError',
        errorMessage: 'Failed to publish stream',
        metadata: {
          browser: 'Chrome',
          version: '1.0.0',
          platform: 'Windows',
          userAgent: 'Mozilla/5.0...',
          timestamp: '2024-01-01T10:00:00Z',
        },
        createdAtCentralAmerica: '2024-01-01T10:00:00Z',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as any);
      mockPrisma.cameraStartFailure.create.mockResolvedValue({} as any);

      await repository.create(data);

      expect(mockPrisma.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
          stage: 'Publish' as any,
          errorName: 'PublishError',
          errorMessage: 'Failed to publish stream',
          deviceCount: undefined,
          devicesSnapshot: undefined,
          attempts: undefined,
          metadata: {
            browser: 'Chrome',
            version: '1.0.0',
            platform: 'Windows',
            userAgent: 'Mozilla/5.0...',
            timestamp: '2024-01-01T10:00:00Z',
          },
          createdAtCentralAmerica: '2024-01-01T10:00:00Z',
        },
      });
    });
  });
});
