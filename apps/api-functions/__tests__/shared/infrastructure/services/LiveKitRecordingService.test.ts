/**
 * @fileoverview Tests for LiveKitRecordingService
 * @description Tests for LiveKit recording operations with Azure Blob Storage integration
 */

import { LiveKitRecordingService } from '../../../../shared/infrastructure/services/LiveKitRecordingService';

// Mock dependencies
jest.mock('livekit-server-sdk', () => ({
  EgressClient: jest.fn().mockImplementation(() => ({
    startRoomCompositeEgress: jest.fn(),
    stopEgress: jest.fn(),
    listEgress: jest.fn(),
  })),
  EncodedFileOutput: jest.fn(),
  EncodedFileType: {
    MP4: 'mp4',
    WEBM: 'webm',
  },
  AzureBlobUpload: jest.fn(),
  EncodingOptions: jest.fn(),
}));

jest.mock('../../../../shared/config', () => ({
  config: {
    livekitApiUrl: 'https://test-livekit.example.com',
    livekitApiKey: 'test-api-key',
    livekitApiSecret: 'test-api-secret',
    azureStorageAccount: 'test-storage-account',
    azureStorageKey: 'test-storage-key',
    recordingsContainerName: 'test-recordings',
  },
}));

jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2025-01-15T10:30:00Z')),
}));

jest.mock('../../../../shared/infrastructure/services/blobSigner', () => ({
  buildBlobHttpsUrl: jest.fn(),
  generateReadSasUrl: jest.fn(),
}));

jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    recordingSession: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('LiveKitRecordingService', () => {
  let liveKitRecordingService: LiveKitRecordingService;
  let mockEgressClient: any;
  let mockPrisma: any;
  let mockBlobSigner: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    liveKitRecordingService = new LiveKitRecordingService();
    
    // Get mocked instances
    const { EgressClient } = require('livekit-server-sdk');
    mockEgressClient = new EgressClient();
    mockPrisma = require('../../../../shared/infrastructure/database/PrismaClientService').default;
    mockBlobSigner = require('../../../../shared/infrastructure/services/blobSigner');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create LiveKitRecordingService instance', () => {
      expect(liveKitRecordingService).toBeInstanceOf(LiveKitRecordingService);
    });

    it('should initialize EgressClient with correct parameters', () => {
      const { EgressClient } = require('livekit-server-sdk');
      expect(EgressClient).toHaveBeenCalledWith(
        'https://test-livekit.example.com',
        'test-api-key',
        'test-api-secret'
      );
    });
  });

  describe('startRecording', () => {
    const mockRoomName = 'test-room';
    const mockParticipantName = 'test-participant';
    const mockParticipantIdentity = 'test-identity';

    it('should start recording successfully', async () => {
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: mockRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: mockRoomName,
        participantName: mockParticipantName,
        participantIdentity: mockParticipantIdentity,
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        mockRoomName,
        mockParticipantName,
        mockParticipantIdentity
      );

      expect(result).toEqual(mockRecordingSession);
      expect(mockEgressClient.startRoomCompositeEgress).toHaveBeenCalledWith(
        expect.objectContaining({
          roomName: mockRoomName,
          layout: 'speaker',
          output: expect.any(Object),
        })
      );
      expect(mockPrisma.recordingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            roomName: mockRoomName,
            participantName: mockParticipantName,
            participantIdentity: mockParticipantIdentity,
            egressId: 'egress-123',
            status: 'STARTING',
            startedAt: new Date('2025-01-15T10:30:00Z'),
            blobPath: null,
            blobUrl: null,
            endedAt: null,
          },
        })
      );
    });

    it('should handle recording start errors', async () => {
      const startError = new Error('Recording start failed');
      mockEgressClient.startRoomCompositeEgress.mockRejectedValue(startError);

      await expect(liveKitRecordingService.startRecording(
        mockRoomName,
        mockParticipantName,
        mockParticipantIdentity
      )).rejects.toThrow('Recording start failed');
    });

    it('should handle different room names', async () => {
      const roomNames = [
        'simple-room',
        'room-with-dashes',
        'room_with_underscores',
        'room.with.dots',
        'room with spaces',
        'room-with-special-chars-@#$%',
      ];

      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: 'test-room',
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: 'test-room',
        participantName: mockParticipantName,
        participantIdentity: mockParticipantIdentity,
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      for (const roomName of roomNames) {
        await liveKitRecordingService.startRecording(
          roomName,
          mockParticipantName,
          mockParticipantIdentity
        );
        expect(mockEgressClient.startRoomCompositeEgress).toHaveBeenCalledWith(
          expect.objectContaining({
            roomName: roomName,
            layout: 'speaker',
            output: expect.any(Object),
          })
        );
      }
    });

    it('should handle different participant names', async () => {
      const participantNames = [
        'simple-participant',
        'participant-with-dashes',
        'participant_with_underscores',
        'participant.with.dots',
        'participant with spaces',
        'participant-with-special-chars-@#$%',
      ];

      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: mockRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: mockRoomName,
        participantName: 'test-participant',
        participantIdentity: mockParticipantIdentity,
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      for (const participantName of participantNames) {
        await liveKitRecordingService.startRecording(
          mockRoomName,
          participantName,
          mockParticipantIdentity
        );
        expect(mockEgressClient.startRoomCompositeEgress).toHaveBeenCalledWith(
          expect.objectContaining({
            roomName: mockRoomName,
            layout: 'speaker',
            output: expect.any(Object),
          })
        );
      }
    });

    it('should handle different participant identities', async () => {
      const participantIdentities = [
        'simple-identity',
        'identity-with-dashes',
        'identity_with_underscores',
        'identity.with.dots',
        'identity with spaces',
        'identity-with-special-chars-@#$%',
      ];

      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: mockRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: mockRoomName,
        participantName: mockParticipantName,
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      for (const participantIdentity of participantIdentities) {
        await liveKitRecordingService.startRecording(
          mockRoomName,
          mockParticipantName,
          participantIdentity
        );
        expect(mockEgressClient.startRoomCompositeEgress).toHaveBeenCalledWith(
          expect.objectContaining({
            roomName: mockRoomName,
            layout: 'speaker',
            output: expect.any(Object),
          })
        );
      }
    });
  });

  describe('stopRecording', () => {
    const mockEgressId = 'egress-123';

    it('should stop recording successfully', async () => {
      const mockEgressInfo = {
        egressId: mockEgressId,
        status: 'EGRESS_ENDING',
        endedAt: new Date('2025-01-15T10:35:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: 'test-room',
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: mockEgressId,
        status: 'ENDING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: new Date('2025-01-15T10:35:00Z'),
      };

      mockEgressClient.stopEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.update.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.stopRecording(mockEgressId);

      expect(result).toEqual(mockRecordingSession);
      expect(mockEgressClient.stopEgress).toHaveBeenCalledWith(mockEgressId);
      expect(mockPrisma.recordingSession.update).toHaveBeenCalledWith({
        where: { egressId: mockEgressId },
        data: {
          status: 'ENDING',
          endedAt: new Date('2025-01-15T10:35:00Z'),
        },
      });
    });

    it('should handle recording stop errors', async () => {
      const stopError = new Error('Recording stop failed');
      mockEgressClient.stopEgress.mockRejectedValue(stopError);

      await expect(liveKitRecordingService.stopRecording(mockEgressId))
        .rejects.toThrow('Recording stop failed');
    });

    it('should handle different egress IDs', async () => {
      const egressIds = [
        'egress-123',
        'egress-456',
        'egress-789',
        'egress-with-special-chars-@#$%',
      ];

      const mockEgressInfo = {
        egressId: 'egress-123',
        status: 'EGRESS_ENDING',
        endedAt: new Date('2025-01-15T10:35:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: 'test-room',
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'ENDING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: new Date('2025-01-15T10:35:00Z'),
      };

      mockEgressClient.stopEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.update.mockResolvedValue(mockRecordingSession);

      for (const egressId of egressIds) {
        await liveKitRecordingService.stopRecording(egressId);
        expect(mockEgressClient.stopEgress).toHaveBeenCalledWith(egressId);
      }
    });
  });

  describe('getRecordingStatus', () => {
    const mockEgressId = 'egress-123';

    it('should get recording status successfully', async () => {
      const mockEgressInfo = {
        egressId: mockEgressId,
        status: 'EGRESS_ACTIVE',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        endedAt: null,
      };

      mockEgressClient.listEgress.mockResolvedValue([mockEgressInfo]);

      const result = await liveKitRecordingService.getRecordingStatus(mockEgressId);

      expect(result).toEqual(mockEgressInfo);
      expect(mockEgressClient.listEgress).toHaveBeenCalledWith({
        egressId: mockEgressId,
      });
    });

    it('should handle recording not found', async () => {
      mockEgressClient.listEgress.mockResolvedValue([]);

      const result = await liveKitRecordingService.getRecordingStatus(mockEgressId);

      expect(result).toBeNull();
    });

    it('should handle status check errors', async () => {
      const statusError = new Error('Status check failed');
      mockEgressClient.listEgress.mockRejectedValue(statusError);

      await expect(liveKitRecordingService.getRecordingStatus(mockEgressId))
        .rejects.toThrow('Status check failed');
    });

    it('should handle different egress IDs', async () => {
      const egressIds = [
        'egress-123',
        'egress-456',
        'egress-789',
        'egress-with-special-chars-@#$%',
      ];

      const mockEgressInfo = {
        egressId: 'egress-123',
        status: 'EGRESS_ACTIVE',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        endedAt: null,
      };

      mockEgressClient.listEgress.mockResolvedValue([mockEgressInfo]);

      for (const egressId of egressIds) {
        await liveKitRecordingService.getRecordingStatus(egressId);
        expect(mockEgressClient.listEgress).toHaveBeenCalledWith({
          egressId: egressId,
        });
      }
    });
  });

  describe('getRecordingSessions', () => {
    const mockRoomName = 'test-room';

    it('should get recording sessions successfully', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          roomName: mockRoomName,
          participantName: 'participant-1',
          participantIdentity: 'identity-1',
          egressId: 'egress-1',
          status: 'ACTIVE',
          startedAt: new Date('2025-01-15T10:30:00Z'),
          blobPath: null,
          blobUrl: null,
          endedAt: null,
        },
        {
          id: 'session-2',
          roomName: mockRoomName,
          participantName: 'participant-2',
          participantIdentity: 'identity-2',
          egressId: 'egress-2',
          status: 'COMPLETED',
          startedAt: new Date('2025-01-15T10:30:00Z'),
          blobPath: 'recordings/session-2.mp4',
          blobUrl: 'https://storage.example.com/recordings/session-2.mp4',
          endedAt: new Date('2025-01-15T10:35:00Z'),
        },
      ];

      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      const result = await liveKitRecordingService.getRecordingSessions(mockRoomName);

      expect(result).toEqual(mockSessions);
      expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
        where: { roomName: mockRoomName },
        orderBy: { startedAt: 'desc' },
      });
    });

    it('should handle empty session list', async () => {
      mockPrisma.recordingSession.findMany.mockResolvedValue([]);

      const result = await liveKitRecordingService.getRecordingSessions(mockRoomName);

      expect(result).toEqual([]);
    });

    it('should handle session retrieval errors', async () => {
      const sessionError = new Error('Session retrieval failed');
      mockPrisma.recordingSession.findMany.mockRejectedValue(sessionError);

      await expect(liveKitRecordingService.getRecordingSessions(mockRoomName))
        .rejects.toThrow('Session retrieval failed');
    });

    it('should handle different room names', async () => {
      const roomNames = [
        'simple-room',
        'room-with-dashes',
        'room_with_underscores',
        'room.with.dots',
        'room with spaces',
        'room-with-special-chars-@#$%',
      ];

      const mockSessions = [
        {
          id: 'session-1',
          roomName: 'test-room',
          participantName: 'participant-1',
          participantIdentity: 'identity-1',
          egressId: 'egress-1',
          status: 'ACTIVE',
          startedAt: new Date('2025-01-15T10:30:00Z'),
          blobPath: null,
          blobUrl: null,
          endedAt: null,
        },
      ];

      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      for (const roomName of roomNames) {
        await liveKitRecordingService.getRecordingSessions(roomName);
        expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
          where: { roomName: roomName },
          orderBy: { startedAt: 'desc' },
        });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long room names', async () => {
      const longRoomName = 'A'.repeat(1000);
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: longRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: longRoomName,
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        longRoomName,
        'test-participant',
        'test-identity'
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle special characters in room names', async () => {
      const specialRoomName = 'room-with-special-chars-@#$%^&*()';
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: specialRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: specialRoomName,
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        specialRoomName,
        'test-participant',
        'test-identity'
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle unicode characters in room names', async () => {
      const unicodeRoomName = '房间-测试';
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: unicodeRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: unicodeRoomName,
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        unicodeRoomName,
        'test-participant',
        'test-identity'
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle empty room names', async () => {
      const emptyRoomName = '';
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: emptyRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: emptyRoomName,
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        emptyRoomName,
        'test-participant',
        'test-identity'
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle null room names', async () => {
      const nullRoomName = null as any;
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: nullRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: nullRoomName,
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        nullRoomName,
        'test-participant',
        'test-identity'
      );

      expect(result).toEqual(mockRecordingSession);
    });
  });

  describe('validation scenarios', () => {
    it('should handle PSO streaming recording scenario', async () => {
      const psoRoomName = 'pso-streaming-room-123';
      const psoParticipantName = 'PSO User';
      const psoParticipantIdentity = 'pso-123';

      const mockEgressInfo = {
        egressId: 'pso-egress-123',
        roomName: psoRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'pso-session-123',
        roomName: psoRoomName,
        participantName: psoParticipantName,
        participantIdentity: psoParticipantIdentity,
        egressId: 'pso-egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        psoRoomName,
        psoParticipantName,
        psoParticipantIdentity
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle supervisor monitoring recording scenario', async () => {
      const supervisorRoomName = 'supervisor-monitoring-room-456';
      const supervisorParticipantName = 'Supervisor User';
      const supervisorParticipantIdentity = 'supervisor-456';

      const mockEgressInfo = {
        egressId: 'supervisor-egress-456',
        roomName: supervisorRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'supervisor-session-456',
        roomName: supervisorRoomName,
        participantName: supervisorParticipantName,
        participantIdentity: supervisorParticipantIdentity,
        egressId: 'supervisor-egress-456',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        supervisorRoomName,
        supervisorParticipantName,
        supervisorParticipantIdentity
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle admin conference recording scenario', async () => {
      const adminRoomName = 'admin-conference-room-789';
      const adminParticipantName = 'Admin User';
      const adminParticipantIdentity = 'admin-789';

      const mockEgressInfo = {
        egressId: 'admin-egress-789',
        roomName: adminRoomName,
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'admin-session-789',
        roomName: adminRoomName,
        participantName: adminParticipantName,
        participantIdentity: adminParticipantIdentity,
        egressId: 'admin-egress-789',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      const result = await liveKitRecordingService.startRecording(
        adminRoomName,
        adminParticipantName,
        adminParticipantIdentity
      );

      expect(result).toEqual(mockRecordingSession);
    });

    it('should handle bulk recording operations scenario', async () => {
      const recordings = [
        { roomName: 'room-1', participantName: 'participant-1', participantIdentity: 'identity-1' },
        { roomName: 'room-2', participantName: 'participant-2', participantIdentity: 'identity-2' },
        { roomName: 'room-3', participantName: 'participant-3', participantIdentity: 'identity-3' },
      ];

      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: 'test-room',
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: 'test-room',
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);

      for (const recording of recordings) {
        await liveKitRecordingService.startRecording(
          recording.roomName,
          recording.participantName,
          recording.participantIdentity
        );
      }

      expect(mockEgressClient.startRoomCompositeEgress).toHaveBeenCalledTimes(3);
      expect(mockPrisma.recordingSession.create).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent operations scenario', async () => {
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomName: 'test-room',
        status: 'EGRESS_STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
      };

      const mockRecordingSession = {
        id: 'session-123',
        roomName: 'test-room',
        participantName: 'test-participant',
        participantIdentity: 'test-identity',
        egressId: 'egress-123',
        status: 'STARTING',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        blobPath: null,
        blobUrl: null,
        endedAt: null,
      };

      mockEgressClient.startRoomCompositeEgress.mockResolvedValue(mockEgressInfo);
      mockEgressClient.stopEgress.mockResolvedValue({
        egressId: 'egress-123',
        status: 'EGRESS_ENDING',
        endedAt: new Date('2025-01-15T10:35:00Z'),
      });
      mockEgressClient.listEgress.mockResolvedValue([{
        egressId: 'egress-123',
        status: 'EGRESS_ACTIVE',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        endedAt: null,
      }]);
      mockPrisma.recordingSession.create.mockResolvedValue(mockRecordingSession);
      mockPrisma.recordingSession.update.mockResolvedValue(mockRecordingSession);

      const promises = [
        liveKitRecordingService.startRecording('room-1', 'participant-1', 'identity-1'),
        liveKitRecordingService.stopRecording('egress-123'),
        liveKitRecordingService.getRecordingStatus('egress-123'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(mockRecordingSession);
      expect(results[1]).toEqual(mockRecordingSession);
      expect(results[2]).toEqual({
        egressId: 'egress-123',
        status: 'EGRESS_ACTIVE',
        startedAt: new Date('2025-01-15T10:30:00Z'),
        endedAt: null,
      });
    });
  });
});
