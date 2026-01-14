import { RecordingDomainService } from '../../../src/domain/services/RecordingDomainService';
import { IRecordingSessionRepository } from '../../../src/domain/interfaces/IRecordingSessionRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetLivekitRecordingsRequest } from '../../../src/domain/value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../../../src/domain/value-objects/GetLivekitRecordingsResponse';
import { RecordingFetchError } from '../../../src/domain/errors/RecordingErrors';
import { createMockRecordingSessionRepository, createMockUserRepository } from './domainServiceTestSetup';
import { RecordingSession } from '../../../src/domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';

jest.mock('../../../src/infrastructure/services/blobSigner', () => ({
  buildBlobHttpsUrl: jest.fn((path: string) => `https://storage.example.com/${path}`),
  generateReadSasUrl: jest.fn((path: string, minutes: number) => `https://storage.example.com/${path}?sas=token`),
}));

describe('RecordingDomainService', () => {
  let service: RecordingDomainService;
  let mockRecordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRecordingRepository = createMockRecordingSessionRepository();
    mockUserRepository = createMockUserRepository();
    service = new RecordingDomainService(mockRecordingRepository, mockUserRepository);
  });

  describe('listRecordings', () => {
    it('should return recordings successfully', async () => {
      const request = new GetLivekitRecordingsRequest('room-name', 10, 'desc', true, 60);
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'subject-id',
        roomId: null,
        egressId: 'egress-id',
        userId: 'initiator-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label',
        status: RecordingStatus.Active,
        startedAt: new Date(),
        stoppedAt: null,
        blobUrl: null,
        blobPath: 'recordings/path.mp4',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
      } as any);
      const users = [
        { id: 'subject-id', email: 'subject@example.com', fullName: 'Subject User' },
        { id: 'initiator-id', email: 'initiator@example.com', fullName: 'Initiator User' },
      ];

      mockRecordingRepository.list.mockResolvedValue([session]);
      mockRecordingRepository.getUsersByIds.mockResolvedValue(users);

      const result = await service.listRecordings(request);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].username).toBe('Subject User');
      expect(result.items[0].recordedBy).toBe('Initiator User');
      expect(result.items[0].playbackUrl).toContain('sas=token');
    });

    it('should return empty response when no recordings', async () => {
      const request = new GetLivekitRecordingsRequest();

      mockRecordingRepository.list.mockResolvedValue([]);

      const result = await service.listRecordings(request);

      expect(result.items).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should use plain URL when includeSas is false', async () => {
      const request = new GetLivekitRecordingsRequest('room-name', 10, 'desc', false, 60);
      const session = RecordingSession.fromPrisma({
        id: 'session-id',
        roomName: 'subject-id',
        roomId: null,
        egressId: 'egress-id',
        userId: 'initiator-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label',
        status: RecordingStatus.Active,
        startedAt: new Date(),
        stoppedAt: null,
        blobUrl: null,
        blobPath: 'recordings/path.mp4',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null,
      } as any);

      mockRecordingRepository.list.mockResolvedValue([session]);
      mockRecordingRepository.getUsersByIds.mockResolvedValue([]);

      const result = await service.listRecordings(request);

      expect(result.items[0].playbackUrl).not.toContain('sas=token');
    });

    it('should throw RecordingFetchError when repository fails', async () => {
      const request = new GetLivekitRecordingsRequest();

      mockRecordingRepository.list.mockRejectedValue(new Error('Database error'));

      await expect(service.listRecordings(request)).rejects.toThrow(RecordingFetchError);
    });
  });
});

