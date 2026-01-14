import { RecordingSessionApplicationService } from '../../../src/application/services/RecordingSessionApplicationService';
import { ILiveKitEgressClient } from '../../../src/domain/interfaces/ILiveKitEgressClient';
import { IRecordingSessionRepository } from '../../../src/domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { IBlobUrlService } from '../../../src/domain/interfaces/IBlobUrlService';
import { IRecordingErrorLogger } from '../../../src/domain/interfaces/IRecordingErrorLogger';
import { RecordingSession } from '../../../src/domain/entities/RecordingSession';
import { RecordingSessionNotFoundError } from '../../../src/domain/errors/ApplicationServiceErrors';
import { RecordingStopStatus } from '../../../src/domain/enums/RecordingStopStatus';
import { RecordingStatus } from '@prisma/client';
import { EgressStatus } from 'livekit-server-sdk';

describe('RecordingSessionApplicationService', () => {
  let service: RecordingSessionApplicationService;
  let mockEgressClient: jest.Mocked<ILiveKitEgressClient>;
  let mockRecordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;
  let mockBlobUrlService: jest.Mocked<IBlobUrlService>;
  let mockErrorLogger: jest.Mocked<IRecordingErrorLogger>;

  beforeEach(() => {
    jest.useFakeTimers();

    mockEgressClient = {
      startEgress: jest.fn(),
      stopEgress: jest.fn(),
      getEgressInfo: jest.fn(),
    } as any;

    mockRecordingRepository = {
      createActive: jest.fn(),
      findById: jest.fn(),
      findActiveByRoom: jest.fn(),
      findActiveBySubject: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
      deleteById: jest.fn(),
    } as any;

    mockBlobStorageService = {
      deleteRecordingByPath: jest.fn(),
    } as any;

    mockBlobUrlService = {
      buildBlobHttpsUrl: jest.fn(),
      generateReadSasUrl: jest.fn(),
    } as any;

    mockErrorLogger = {
      logError: jest.fn(),
    } as any;

    service = new RecordingSessionApplicationService(
      mockEgressClient,
      mockRecordingRepository,
      mockBlobStorageService,
      mockBlobUrlService,
      mockErrorLogger
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  describe('startRecordingSession', () => {
    const args = {
      roomName: 'room-123',
      subjectLabel: 'Subject User',
      initiatorUserId: 'initiator-id',
      subjectUserId: 'subject-id',
    };

    it('should successfully start recording session', async () => {
      const egressResult = { egressId: 'egress-id', objectKey: 'blob/path' };
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject User',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockEgressClient.startEgress.mockResolvedValue(egressResult);
      mockRecordingRepository.createActive.mockResolvedValue(session);
      mockEgressClient.getEgressInfo.mockResolvedValue({
        egressId: 'egress-id',
        status: EgressStatus.EGRESS_ACTIVE,
      } as any);

      const result = await service.startRecordingSession(args);

      expect(mockEgressClient.startEgress).toHaveBeenCalledWith('room-123', 'Subject User');
      expect(mockRecordingRepository.createActive).toHaveBeenCalled();
      expect(result.roomName).toBe('room-123');
      expect(result.egressId).toBe('egress-id');
      expect(result.blobPath).toBe('blob/path');
    });

    it('should mark session as failed when egress start fails', async () => {
      const egressResult = { egressId: 'egress-id', objectKey: 'blob/path' };
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject User',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockEgressClient.startEgress.mockResolvedValue(egressResult);
      mockRecordingRepository.createActive.mockResolvedValue(session);
      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);
      mockEgressClient.getEgressInfo.mockResolvedValue({
        egressId: 'egress-id',
        status: EgressStatus.EGRESS_FAILED,
      } as any);

      await service.startRecordingSession(args);

      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      expect(mockRecordingRepository.fail).toHaveBeenCalledWith('session-id');
    });

    it('should handle error when session creation fails', async () => {
      const egressResult = { egressId: 'egress-id', objectKey: 'blob/path' };

      mockEgressClient.startEgress.mockResolvedValue(egressResult);
      mockRecordingRepository.createActive.mockRejectedValue(new Error('Database error'));
      mockErrorLogger.logError.mockResolvedValue(undefined);

      await expect(service.startRecordingSession(args)).rejects.toThrow('Database error');
    });

    it('should handle error when egress start fails without session', async () => {
      mockEgressClient.startEgress.mockRejectedValue(new Error('Egress failed'));
      mockErrorLogger.logError.mockResolvedValue(undefined);

      await expect(service.startRecordingSession(args)).rejects.toThrow('Egress failed');
    });

    it('should handle error when fail call fails', async () => {
      const egressResult = { egressId: 'egress-id', objectKey: 'blob/path' };
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject User',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockEgressClient.startEgress.mockResolvedValue(egressResult);
      mockRecordingRepository.createActive.mockResolvedValue(session);
      mockRecordingRepository.createActive.mockRejectedValueOnce(new Error('Create failed'));
      mockRecordingRepository.fail.mockRejectedValue(new Error('Fail failed'));
      mockErrorLogger.logError.mockResolvedValue(undefined);

      await expect(service.startRecordingSession(args)).rejects.toThrow('Create failed');
    });
  });

  describe('findActiveSessions', () => {
    it('should successfully find active sessions by room and subject', async () => {
      const userId = 'user-id';
      const session1 = new RecordingSession(
        'session-1',
        userId,
        null,
        'egress-1',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const session2 = new RecordingSession(
        'session-2',
        'other-room',
        null,
        'egress-2',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([session1]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([session2]);

      const result = await service.findActiveSessions(userId);

      expect(result).toHaveLength(2);
      expect(result).toContain(session1);
      expect(result).toContain(session2);
    });

    it('should deduplicate sessions when same session found in both queries', async () => {
      const userId = 'user-id';
      const session = new RecordingSession(
        'session-1',
        userId,
        null,
        'egress-1',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([session]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([session]);

      const result = await service.findActiveSessions(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(session);
    });
  });

  describe('handleCompletedSession', () => {
    it('should successfully handle completed session with blobUrl', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const blobUrl = 'https://storage.blob.core.windows.net/recordings/blob/path';
      const sasUrl = 'https://storage.blob.core.windows.net/recordings/blob/path?sas=token';

      mockRecordingRepository.complete.mockResolvedValue(undefined);
      mockBlobUrlService.generateReadSasUrl.mockReturnValue(sasUrl);

      const result = await service.handleCompletedSession(session, blobUrl, 60);

      expect(mockRecordingRepository.complete).toHaveBeenCalledWith(
        'session-id',
        blobUrl,
        expect.any(String)
      );
      expect(mockBlobUrlService.generateReadSasUrl).toHaveBeenCalledWith('blob/path', 60);
      expect(result.status).toBe(RecordingStopStatus.Completed);
      expect(result.blobUrl).toBe(blobUrl);
      expect(result.sasUrl).toBe(sasUrl);
    });

    it('should use built blob URL when blobUrl not provided', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const builtUrl = 'https://storage.blob.core.windows.net/recordings/blob/path';
      const sasUrl = 'https://storage.blob.core.windows.net/recordings/blob/path?sas=token';

      mockRecordingRepository.complete.mockResolvedValue(undefined);
      mockBlobUrlService.buildBlobHttpsUrl.mockReturnValue(builtUrl);
      mockBlobUrlService.generateReadSasUrl.mockReturnValue(sasUrl);

      const result = await service.handleCompletedSession(session, undefined, 60);

      expect(mockBlobUrlService.buildBlobHttpsUrl).toHaveBeenCalledWith('blob/path');
      expect(result.blobUrl).toBe(builtUrl);
    });

    it('should handle session without blobPath', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      mockRecordingRepository.complete.mockResolvedValue(undefined);

      const result = await service.handleCompletedSession(session, undefined, 60);

      expect(mockRecordingRepository.complete).toHaveBeenCalledWith('session-id', null, expect.any(String));
      expect(result.sasUrl).toBeUndefined();
    });

    it('should use minimum 1 minute for SAS URL', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.complete.mockResolvedValue(undefined);
      mockBlobUrlService.generateReadSasUrl.mockReturnValue('sas-url');

      await service.handleCompletedSession(session, undefined, 0);

      expect(mockBlobUrlService.generateReadSasUrl).toHaveBeenCalledWith('blob/path', 1);
    });
  });

  describe('handleFailedSession', () => {
    it('should successfully handle failed session', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const egressError = 'Egress failed';
      const clusterErrorDetails = { status: 'EGRESS_FAILED' };

      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);

      const result = await service.handleFailedSession(session, egressError, clusterErrorDetails);

      expect(mockRecordingRepository.fail).toHaveBeenCalledWith('session-id');
      expect(mockErrorLogger.logError).toHaveBeenCalled();
      expect(result.status).toBe(RecordingStopStatus.Failed);
      expect(result.blobUrl).toBeUndefined();
    });

    it('should handle failed session without error logger', async () => {
      const serviceWithoutLogger = new RecordingSessionApplicationService(
        mockEgressClient,
        mockRecordingRepository,
        mockBlobStorageService,
        mockBlobUrlService
      );
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.fail.mockResolvedValue(undefined);

      const result = await serviceWithoutLogger.handleFailedSession(session, 'Error', undefined);

      expect(result.status).toBe(RecordingStopStatus.Failed);
    });

    it('should handle cluster error details with status', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const clusterErrorDetails = { status: 'EGRESS_ABORTED' };

      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);

      await service.handleFailedSession(session, 'Error', clusterErrorDetails);

      expect(mockErrorLogger.logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          egressStatus: 'EGRESS_ABORTED',
        })
      );
    });
  });

  describe('handleDisconnectedSession', () => {
    it('should successfully handle disconnected session with blobPath', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const blobUrl = 'https://storage.blob.core.windows.net/recordings/blob/path';

      mockBlobUrlService.buildBlobHttpsUrl.mockReturnValue(blobUrl);
      mockRecordingRepository.complete.mockResolvedValue(undefined);

      const result = await service.handleDisconnectedSession(session);

      expect(mockBlobUrlService.buildBlobHttpsUrl).toHaveBeenCalledWith('blob/path');
      expect(mockRecordingRepository.complete).toHaveBeenCalledWith(
        'session-id',
        blobUrl,
        expect.any(String)
      );
      expect(result.status).toBe(RecordingStopStatus.CompletedDisconnection);
      expect(result.blobUrl).toBe(blobUrl);
    });

    it('should handle disconnected session without blobPath', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      mockRecordingRepository.complete.mockResolvedValue(undefined);

      const result = await service.handleDisconnectedSession(session);

      expect(mockBlobUrlService.buildBlobHttpsUrl).not.toHaveBeenCalled();
      expect(mockRecordingRepository.complete).toHaveBeenCalledWith('session-id', null, expect.any(String));
      expect(result.blobUrl).toBeUndefined();
    });
  });

  describe('handleStopError', () => {
    it('should successfully handle stop error', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const error = new Error('Stop failed');

      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);

      const result = await service.handleStopError(session, error);

      expect(mockRecordingRepository.fail).toHaveBeenCalledWith('session-id');
      expect(mockErrorLogger.logError).toHaveBeenCalled();
      expect(result.status).toBe(RecordingStopStatus.Failed);
    });

    it('should handle stop error without error logger', async () => {
      const serviceWithoutLogger = new RecordingSessionApplicationService(
        mockEgressClient,
        mockRecordingRepository,
        mockBlobStorageService,
        mockBlobUrlService
      );
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.fail.mockResolvedValue(undefined);

      const result = await serviceWithoutLogger.handleStopError(session, new Error('Error'));

      expect(result.status).toBe(RecordingStopStatus.Failed);
    });

    it('should handle non-Error type in handleStopError', async () => {
      const session = new RecordingSession(
        'session-id',
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);

      const result = await service.handleStopError(session, 'String error');

      expect(result.status).toBe(RecordingStopStatus.Failed);
    });
  });

  describe('stopAllRecordingsForUser', () => {
    it('should return empty result when no active sessions', async () => {
      const userId = 'user-id';
      mockRecordingRepository.findActiveByRoom.mockResolvedValue([]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);

      const result = await service.stopAllRecordingsForUser(userId, 60);

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.results).toEqual([]);
      expect(result.message).toContain('No active recordings');
    });

    it('should successfully stop all recordings', async () => {
      const userId = 'user-id';
      const session1 = new RecordingSession(
        'session-1',
        'room-123',
        null,
        'egress-1',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );
      const session2 = new RecordingSession(
        'session-2',
        'room-456',
        null,
        'egress-2',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([session1]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([session2]);
      mockEgressClient.getEgressInfo.mockResolvedValue({
        egressId: 'egress-1',
        status: EgressStatus.EGRESS_ACTIVE,
      } as any);
      mockEgressClient.stopEgress.mockResolvedValue({
        info: { egressId: 'egress-1' } as any,
        blobUrl: 'https://blob.url',
      });
      mockRecordingRepository.complete.mockResolvedValue(undefined);
      mockBlobUrlService.generateReadSasUrl.mockReturnValue('sas-url');

      const result = await service.stopAllRecordingsForUser(userId, 60);

      expect(result.total).toBe(2);
      expect(result.completed).toBeGreaterThan(0);
    });

    it('should handle disconnected session when egress not found', async () => {
      const userId = 'user-id';
      const session = new RecordingSession(
        'session-1',
        'room-123',
        null,
        'egress-1',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([session]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);
      mockEgressClient.getEgressInfo.mockResolvedValue(null);
      mockEgressClient.stopEgress.mockRejectedValue(new Error('not found'));
      mockBlobUrlService.buildBlobHttpsUrl.mockReturnValue('https://blob.url');
      mockRecordingRepository.complete.mockResolvedValue(undefined);

      const result = await service.stopAllRecordingsForUser(userId, 60);

      expect(result.results[0].status).toBe(RecordingStopStatus.CompletedDisconnection);
    });

    it('should handle failed session when stop fails with egress_failed', async () => {
      const userId = 'user-id';
      const session = new RecordingSession(
        'session-1',
        'room-123',
        null,
        'egress-1',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([session]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);
      mockEgressClient.getEgressInfo.mockResolvedValue({
        egressId: 'egress-1',
        status: EgressStatus.EGRESS_FAILED,
      } as any);
      mockEgressClient.stopEgress.mockRejectedValue(new Error('egress_failed'));
      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);

      const result = await service.stopAllRecordingsForUser(userId, 60);

      expect(result.results[0].status).toBe(RecordingStopStatus.Failed);
    });

    it('should handle error when processing session stop', async () => {
      const userId = 'user-id';
      const session = new RecordingSession(
        'session-1',
        'room-123',
        null,
        'egress-1',
        'initiator-id',
        userId,
        'Subject',
        RecordingStatus.Active,
        new Date(),
        null,
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findActiveByRoom.mockResolvedValue([session]);
      mockRecordingRepository.findActiveBySubject.mockResolvedValue([]);
      mockEgressClient.getEgressInfo.mockRejectedValue(new Error('Get info failed'));
      mockEgressClient.stopEgress.mockRejectedValue(new Error('Stop failed'));
      mockRecordingRepository.fail.mockResolvedValue(undefined);
      mockErrorLogger.logError.mockResolvedValue(undefined);

      const result = await service.stopAllRecordingsForUser(userId, 60);

      expect(result.results).toHaveLength(1);
    });
  });

  describe('deleteRecording', () => {
    it('should successfully delete recording with blob', async () => {
      const sessionId = 'session-id';
      const session = new RecordingSession(
        sessionId,
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Completed,
        new Date(),
        new Date(),
        'https://blob.url',
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findById.mockResolvedValue(session);
      mockBlobStorageService.deleteRecordingByPath.mockResolvedValue(true);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(sessionId);

      expect(mockRecordingRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(mockBlobStorageService.deleteRecordingByPath).toHaveBeenCalledWith('blob/path');
      expect(mockRecordingRepository.deleteById).toHaveBeenCalledWith(sessionId);
      expect(result.sessionId).toBe(sessionId);
      expect(result.blobDeleted).toBe(true);
      expect(result.dbDeleted).toBe(true);
    });

    it('should successfully delete recording without blob', async () => {
      const sessionId = 'session-id';
      const session = new RecordingSession(
        sessionId,
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Completed,
        new Date(),
        new Date(),
        null,
        null,
        new Date(),
        new Date()
      );

      mockRecordingRepository.findById.mockResolvedValue(session);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(sessionId);

      expect(mockBlobStorageService.deleteRecordingByPath).not.toHaveBeenCalled();
      expect(result.blobMissing).toBe(true);
    });

    it('should parse blob path from URL when blobPath is null', async () => {
      const sessionId = 'session-id';
      const session = new RecordingSession(
        sessionId,
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Completed,
        new Date(),
        new Date(),
        'https://account.blob.core.windows.net/recordings/path/to/file.mp4',
        null,
        new Date(),
        new Date()
      );

      mockRecordingRepository.findById.mockResolvedValue(session);
      mockBlobStorageService.deleteRecordingByPath.mockResolvedValue(true);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(sessionId);

      expect(result.blobPath).toBeDefined();
    });

    it('should handle blob deletion failure', async () => {
      const sessionId = 'session-id';
      const session = new RecordingSession(
        sessionId,
        'room-123',
        null,
        'egress-id',
        'initiator-id',
        'subject-id',
        'Subject',
        RecordingStatus.Completed,
        new Date(),
        new Date(),
        null,
        'blob/path',
        new Date(),
        new Date()
      );

      mockRecordingRepository.findById.mockResolvedValue(session);
      mockBlobStorageService.deleteRecordingByPath.mockResolvedValue(false);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(sessionId);

      expect(result.blobDeleted).toBe(false);
      expect(result.blobMissing).toBe(true);
    });

    it('should throw error when session not found', async () => {
      const sessionId = 'non-existent';

      mockRecordingRepository.findById.mockResolvedValue(null);

      await expect(service.deleteRecording(sessionId)).rejects.toThrow(
        RecordingSessionNotFoundError
      );
    });
  });
});

