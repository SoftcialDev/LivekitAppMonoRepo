import { LiveKitRecordingService } from '../../../src/infrastructure/services/LiveKitRecordingService';
import { IRecordingSessionRepository } from '../../../src/domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { IErrorLogService } from '../../../src/domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { RecordingStopStatus } from '../../../src/domain/enums/RecordingStopStatus';
import { EntityNotFoundError } from '../../../src/domain/errors';
import { config } from '../../../src/config';
import { LiveKitEgressClient } from '../../../src/infrastructure/services/LiveKitEgressClient';

jest.mock('../../../src/config', () => ({
  config: {
    livekitApiUrl: 'https://test.livekit.io',
    livekitApiKey: 'test-key',
    livekitApiSecret: 'test-secret',
    recordingsContainerName: 'recordings',
    snapshotContainerName: 'snapshots',
    storageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=testkey;EndpointSuffix=core.windows.net',
  },
}));
jest.mock('../../../src/infrastructure/services/LiveKitEgressClient', () => ({
  LiveKitEgressClient: jest.fn().mockImplementation(() => ({
    startEgress: jest.fn(),
    stopEgress: jest.fn(),
    getEgressInfo: jest.fn(),
  })),
}));

describe('LiveKitRecordingService', () => {
  let recordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let blobStorageService: jest.Mocked<IBlobStorageService>;
  let errorLogService: jest.Mocked<IErrorLogService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let service: LiveKitRecordingService;

  beforeEach(() => {
    jest.clearAllMocks();

    recordingRepository = {} as any;
    blobStorageService = {} as any;
    errorLogService = {} as any;
    userRepository = {} as any;

    service = new LiveKitRecordingService(
      recordingRepository,
      blobStorageService,
      errorLogService,
      userRepository
    );
  });

  describe('constructor', () => {
    it('should create service with all dependencies', () => {
      expect(service).toBeInstanceOf(LiveKitRecordingService);
    });

    it('should create service without optional dependencies', () => {
      const serviceWithoutOptional = new LiveKitRecordingService(
        recordingRepository,
        blobStorageService
      );
      expect(serviceWithoutOptional).toBeInstanceOf(LiveKitRecordingService);
    });
  });

  describe('startAndPersist', () => {
    it('should delegate to application service', async () => {
      const args = {
        roomName: 'room-123',
        subjectLabel: 'Subject Label',
        initiatorUserId: 'initiator-id',
        subjectUserId: 'subject-id',
      };
      const expectedResult = {
        roomName: 'room-123',
        egressId: 'egress-123',
        blobPath: '/path/to/blob',
      };

      const startRecordingSessionSpy = jest.spyOn(
        (service as any).applicationService,
        'startRecordingSession'
      );
      startRecordingSessionSpy.mockResolvedValue(expectedResult);

      const result = await service.startAndPersist(args);

      expect(startRecordingSessionSpy).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('stopAndPersist', () => {
    it('should stop recordings and return results', async () => {
      const args = {
        roomName: 'room-123',
        initiatorUserId: 'initiator-id',
        subjectUserId: 'subject-id',
        sasMinutes: 30,
      };
      const mockResults = [
        {
          sessionId: 'session-1',
          egressId: 'egress-1',
          status: RecordingStopStatus.Completed,
          blobPath: '/path/to/blob',
          blobUrl: 'https://blob.url',
          sasUrl: 'https://sas.url',
        },
      ];

      const stopAllRecordingsForUserSpy = jest.spyOn(
        (service as any).applicationService,
        'stopAllRecordingsForUser'
      );
      stopAllRecordingsForUserSpy.mockResolvedValue({
        message: 'Stopped',
        results: mockResults,
      });

      const result = await service.stopAndPersist(args);

      expect(stopAllRecordingsForUserSpy).toHaveBeenCalledWith('subject-id', 30);
      expect(result.message).toBe('Stopped');
      expect(result.roomName).toBe('room-123');
      expect(result.results).toEqual(mockResults);
      expect(result.sasUrl).toBe('https://sas.url');
    });

    it('should use roomName as subjectUserId when subjectUserId is not provided', async () => {
      const args = {
        roomName: 'room-123',
        initiatorUserId: 'initiator-id',
      };

      const stopAllRecordingsForUserSpy = jest.spyOn(
        (service as any).applicationService,
        'stopAllRecordingsForUser'
      );
      stopAllRecordingsForUserSpy.mockResolvedValue({
        message: 'Stopped',
        results: [],
      });

      await expect(service.stopAndPersist(args)).rejects.toThrow(EntityNotFoundError);

      expect(stopAllRecordingsForUserSpy).toHaveBeenCalledWith('room-123', 60);
    });

    it('should throw EntityNotFoundError when no recordings found', async () => {
      const args = {
        roomName: 'room-123',
        initiatorUserId: 'initiator-id',
        subjectUserId: 'subject-id',
      };

      const stopAllRecordingsForUserSpy = jest.spyOn(
        (service as any).applicationService,
        'stopAllRecordingsForUser'
      );
      stopAllRecordingsForUserSpy.mockResolvedValue({
        message: 'No recordings',
        results: [],
      });

      await expect(service.stopAndPersist(args)).rejects.toThrow(EntityNotFoundError);
      await expect(service.stopAndPersist(args)).rejects.toThrow('No active recordings found');
    });

    it('should not include sasUrl when multiple results', async () => {
      const args = {
        roomName: 'room-123',
        initiatorUserId: 'initiator-id',
        subjectUserId: 'subject-id',
      };
      const mockResults = [
        {
          sessionId: 'session-1',
          egressId: 'egress-1',
          status: RecordingStopStatus.Completed,
          sasUrl: 'https://sas1.url',
        },
        {
          sessionId: 'session-2',
          egressId: 'egress-2',
          status: RecordingStopStatus.Completed,
          sasUrl: 'https://sas2.url',
        },
      ];

      const stopAllRecordingsForUserSpy = jest.spyOn(
        (service as any).applicationService,
        'stopAllRecordingsForUser'
      );
      stopAllRecordingsForUserSpy.mockResolvedValue({
        message: 'Stopped',
        results: mockResults,
      });

      const result = await service.stopAndPersist(args);

      expect(result.sasUrl).toBeUndefined();
    });
  });

  describe('stopAllForUser', () => {
    it('should delegate to application service', async () => {
      const userId = 'user-id';
      const sasMinutes = 30;
      const expectedResult = {
        message: 'Stopped',
        results: [],
        total: 0,
        completed: 0,
      };

      const stopAllRecordingsForUserSpy = jest.spyOn(
        (service as any).applicationService,
        'stopAllRecordingsForUser'
      );
      stopAllRecordingsForUserSpy.mockResolvedValue(expectedResult);

      const result = await service.stopAllForUser(userId, sasMinutes);

      expect(stopAllRecordingsForUserSpy).toHaveBeenCalledWith(userId, sasMinutes);
      expect(result).toEqual(expectedResult);
    });

    it('should use default sasMinutes when not provided', async () => {
      const userId = 'user-id';
      const expectedResult = {
        message: 'Stopped',
        results: [],
        total: 0,
        completed: 0,
      };

      const stopAllRecordingsForUserSpy = jest.spyOn(
        (service as any).applicationService,
        'stopAllRecordingsForUser'
      );
      stopAllRecordingsForUserSpy.mockResolvedValue(expectedResult);

      await service.stopAllForUser(userId);

      expect(stopAllRecordingsForUserSpy).toHaveBeenCalledWith(userId, 60);
    });
  });

  describe('deleteRecordingById', () => {
    it('should delegate to application service', async () => {
      const sessionId = 'session-123';
      const expectedResult = {
        sessionId: 'session-123',
        blobPath: '/path/to/blob',
        blobDeleted: true,
        blobMissing: false,
        dbDeleted: true,
      };

      const deleteRecordingSpy = jest.spyOn(
        (service as any).applicationService,
        'deleteRecording'
      );
      deleteRecordingSpy.mockResolvedValue(expectedResult);

      const result = await service.deleteRecordingById(sessionId);

      expect(deleteRecordingSpy).toHaveBeenCalledWith(sessionId);
      expect(result).toEqual(expectedResult);
    });
  });
});

