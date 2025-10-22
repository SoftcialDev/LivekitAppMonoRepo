import { LiveKitRecordingService } from '../../../../shared/infrastructure/services/LiveKitRecordingService';
import { config } from '../../../../shared/config';
import { getCentralAmericaTime } from '../../../../shared/utils/dateUtils';
import { buildBlobHttpsUrl, generateReadSasUrl } from '../../../../shared/infrastructure/services/blobSigner';
import { IRecordingSessionRepository } from '../../../../shared/domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { RecordingSession } from '../../../../shared/domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../../shared/config');
jest.mock('../../../../shared/utils/dateUtils');
jest.mock('../../../../shared/infrastructure/services/blobSigner');
jest.mock('livekit-server-sdk', () => ({
  EgressClient: jest.fn().mockImplementation(() => ({
    startRoomCompositeEgress: jest.fn(),
    stopEgress: jest.fn(),
  })),
  EncodedFileOutput: jest.fn(),
  EncodedFileType: { MP4: 'mp4' },
  AzureBlobUpload: jest.fn(),
  EncodingOptions: jest.fn(),
}));

const mockConfig = config as jest.Mocked<typeof config>;
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockBuildBlobHttpsUrl = buildBlobHttpsUrl as jest.MockedFunction<typeof buildBlobHttpsUrl>;
const mockGenerateReadSasUrl = generateReadSasUrl as jest.MockedFunction<typeof generateReadSasUrl>;

describe('LiveKitRecordingService', () => {
  let liveKitRecordingService: LiveKitRecordingService;
  let mockRecordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;
  let mockEgressClient: any;

  // Helper function to create RecordingSession instances
  const createMockRecordingSession = (overrides: Partial<any> = {}): RecordingSession => {
    const defaults = {
      id: 'session-123',
      roomName: 'room-123',
      roomId: 'room-id-123',
      egressId: 'egress-123',
      userId: 'user-1',
      subjectUserId: 'user-2',
      subjectLabel: 'test-user',
      status: 'Active' as any,
      startedAt: new Date('2023-01-01T00:00:00.000Z'),
      stoppedAt: null,
      blobUrl: null,
      blobPath: 'test-path.mp4',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return new RecordingSession(
      overrides.id || defaults.id,
      overrides.roomName || defaults.roomName,
      overrides.roomId || defaults.roomId,
      overrides.egressId || defaults.egressId,
      overrides.userId || defaults.userId,
      overrides.subjectUserId || defaults.subjectUserId,
      overrides.subjectLabel || defaults.subjectLabel,
      overrides.status || defaults.status,
      overrides.startedAt || defaults.startedAt,
      overrides.stoppedAt || defaults.stoppedAt,
      overrides.blobUrl || defaults.blobUrl,
      overrides.blobPath || defaults.blobPath,
      overrides.createdAt || defaults.createdAt,
      overrides.updatedAt || defaults.updatedAt,
      overrides.user || undefined
    );
  };

  beforeEach(() => {
    // Mock config values
    mockConfig.livekitApiUrl = 'https://test-livekit.example.com';
    mockConfig.livekitApiKey = 'test-api-key';
    mockConfig.livekitApiSecret = 'test-api-secret';
    (mockConfig as any).accountName = 'testaccount';
    (mockConfig as any).accountKey = 'test-key';
    (mockConfig as any).azureBlobStorageAccountName = 'testaccount';
    (mockConfig as any).azureBlobStorageAccountKey = 'test-key';
    (mockConfig as any).azureBlobStorageContainerName = 'recordings';

    // Mock date utils
    mockGetCentralAmericaTime.mockReturnValue(new Date('2023-01-01T00:00:00.000Z'));

    // Mock blob signer functions
    mockBuildBlobHttpsUrl.mockReturnValue('https://testaccount.blob.core.windows.net/recordings/test-path.mp4');
    mockGenerateReadSasUrl.mockReturnValue('https://testaccount.blob.core.windows.net/recordings/test-path.mp4?sas-token');

    // Mock EgressClient
    const { EgressClient } = require('livekit-server-sdk');
    mockEgressClient = new EgressClient();
    mockEgressClient.startRoomCompositeEgress.mockResolvedValue({
      egressId: 'egress-123',
      status: 'EGRESS_STARTING',
    });
    mockEgressClient.stopEgress.mockResolvedValue({
      status: 'EGRESS_ENDED',
    });

    // Mock repositories
    mockRecordingRepository = {
      findById: jest.fn(),
      list: jest.fn(),
      getUsersByIds: jest.fn(),
      createActive: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
      deleteById: jest.fn(),
      findActiveByRoom: jest.fn(),
      findActiveBySubject: jest.fn(),
      findActiveByInitiator: jest.fn(),
    };

    mockBlobStorageService = {
      uploadImage: jest.fn(),
      downloadImage: jest.fn(),
      deleteImage: jest.fn(),
      deleteRecordingByPath: jest.fn(),
    };

    // Create service instance
    liveKitRecordingService = new LiveKitRecordingService(
      mockRecordingRepository,
      mockBlobStorageService
    );

    // Replace the private egressClient with our mock
    (liveKitRecordingService as any).egressClient = mockEgressClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create LiveKitRecordingService instance', () => {
      expect(liveKitRecordingService).toBeInstanceOf(LiveKitRecordingService);
    });
  });

  describe('startAndPersist', () => {
    it('should start recording successfully', async () => {
      const mockSession = createMockRecordingSession();

      mockRecordingRepository.createActive.mockResolvedValue(mockSession);

      const args = {
        roomName: 'room-123',
        subjectLabel: 'test-user',
        initiatorUserId: 'user-1',
        subjectUserId: 'user-2',
      };

      const result = await liveKitRecordingService.startAndPersist(args);

      expect(result.roomName).toBe('room-123');
      expect(result.egressId).toBeDefined();
      expect(result.blobPath).toBeDefined();
      expect(mockRecordingRepository.createActive).toHaveBeenCalled();
    });

    it('should handle recording start errors', async () => {
      mockRecordingRepository.createActive.mockRejectedValue(new Error('Recording start failed'));

      const args = {
        roomName: 'room-123',
        subjectLabel: 'test-user',
        initiatorUserId: 'user-1',
        subjectUserId: 'user-2',
      };

      await expect(liveKitRecordingService.startAndPersist(args))
        .rejects.toThrow('Recording start failed');
    });
  });

  describe('stopAndPersist', () => {
    it('should stop recording successfully', async () => {
      const mockSession = createMockRecordingSession();

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([mockSession]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);
      mockRecordingRepository.complete.mockResolvedValue(undefined);

      const args = {
        roomName: 'room-123',
        initiatorUserId: 'user-1',
        subjectUserId: 'user-2',
        sasMinutes: 60,
      };

      const result = await liveKitRecordingService.stopAndPersist(args);

      expect(result.message).toContain('Recording stop (subject=user-2)');
      expect(result.roomName).toBe('room-123');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('Completed');
    });

    it('should handle no active recordings found', async () => {
      mockRecordingRepository.findActiveByRoom.mockResolvedValue([]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);

      const args = {
        roomName: 'room-123',
        initiatorUserId: 'user-1',
        subjectUserId: 'user-2',
      };

      await expect(liveKitRecordingService.stopAndPersist(args)).rejects.toThrow(
        'No active recordings found for this subject'
      );
    });
  });

  describe('deleteRecordingById', () => {
    it('should delete recording successfully', async () => {
      const mockSession = createMockRecordingSession();

      mockRecordingRepository.findById.mockResolvedValue(mockSession);
      mockBlobStorageService.deleteRecordingByPath.mockResolvedValue(true);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await liveKitRecordingService.deleteRecordingById('session-123');

      expect(result.sessionId).toBe('session-123');
      expect(result.blobDeleted).toBe(true);
      expect(result.dbDeleted).toBe(true);
      expect(mockRecordingRepository.findById).toHaveBeenCalledWith('session-123');
      expect(mockBlobStorageService.deleteRecordingByPath).toHaveBeenCalledWith('test-path.mp4');
      expect(mockRecordingRepository.deleteById).toHaveBeenCalledWith('session-123');
    });

    it('should handle recording not found', async () => {
      mockRecordingRepository.findById.mockResolvedValue(null);

      await expect(liveKitRecordingService.deleteRecordingById('session-123'))
        .rejects.toThrow('Recording session not found');
    });

    it('should handle delete errors gracefully', async () => {
      const mockSession = createMockRecordingSession();

      mockRecordingRepository.findById.mockResolvedValue(mockSession);
      mockBlobStorageService.deleteRecordingByPath.mockRejectedValue(new Error('Blob delete failed'));

      // Should throw the error
      await expect(liveKitRecordingService.deleteRecordingById('session-123'))
        .rejects.toThrow('Blob delete failed');
    });
  });

  describe('stopAllForUser', () => {
    it('should stop all recordings for user successfully', async () => {
      const mockSessions = [
        createMockRecordingSession({ id: 'session-1', egressId: 'egress-1', subjectLabel: 'test-user-1' }),
        createMockRecordingSession({ id: 'session-2', egressId: 'egress-2', subjectLabel: 'test-user-2' }),
      ];

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([mockSessions[0]]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([mockSessions[1]]);
      mockRecordingRepository.complete.mockResolvedValue(undefined);

      const result = await liveKitRecordingService.stopAllForUser('user-1');

      expect(result.message).toContain('Recording stop (subject=user-1)');
      expect(result.total).toBe(2);
      expect(result.completed).toBe(2);
      expect(mockRecordingRepository.complete).toHaveBeenCalledTimes(2);
    });

    it('should handle no recordings found', async () => {
      mockRecordingRepository.findActiveByRoom.mockResolvedValue([]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);

      const result = await liveKitRecordingService.stopAllForUser('user-1');

      expect(result.message).toContain('No active recordings to stop');
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});
