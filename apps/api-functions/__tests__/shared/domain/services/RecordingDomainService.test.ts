import { RecordingDomainService } from '../../../../shared/domain/services/RecordingDomainService';
import { GetLivekitRecordingsRequest } from '../../../../shared/domain/value-objects/GetLivekitRecordingsRequest';
import { IRecordingSessionRepository } from '../../../../shared/domain/interfaces/IRecordingSessionRepository';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { RecordingSession } from '../../../../shared/domain/entities/RecordingSession';

describe('RecordingDomainService', () => {
  let service: RecordingDomainService;
  let recordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables required for blob storage
    process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';
    process.env.AZURE_STORAGE_KEY = 'testkey';
    process.env.RECORDINGS_CONTAINER_NAME = 'recordings';
    recordingRepository = { list: jest.fn(), getUsersByIds: jest.fn() } as any;
    userRepository = {} as any;
    service = new RecordingDomainService(recordingRepository, userRepository);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AZURE_STORAGE_ACCOUNT;
    delete process.env.AZURE_STORAGE_KEY;
    delete process.env.RECORDINGS_CONTAINER_NAME;
  });

  describe('listRecordings', () => {
    it('should list recordings with user data', async () => {
      const mockSessions = [new RecordingSession('session-123', 'room-123', null, 'egress-123', 'user-123', null, null, 'Completed' as any, new Date(), new Date(), null, 'path/to/recording.mp4', new Date(), new Date())];
      const mockUsers = [{ id: 'user-123', email: 'user@example.com', fullName: 'User Name' }];
      recordingRepository.list.mockResolvedValue(mockSessions);
      recordingRepository.getUsersByIds.mockResolvedValue(mockUsers as any);
      const request = new GetLivekitRecordingsRequest();
      const result = await service.listRecordings(request);
      expect(result.items).toHaveLength(1);
    });

    it('should return empty when no recordings found', async () => {
      recordingRepository.list.mockResolvedValue([]);
      const request = new GetLivekitRecordingsRequest();
      const result = await service.listRecordings(request);
      expect(result.items).toHaveLength(0);
    });
  });
});