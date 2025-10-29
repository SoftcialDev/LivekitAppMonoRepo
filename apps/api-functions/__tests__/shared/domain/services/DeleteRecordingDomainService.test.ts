import { DeleteRecordingDomainService } from '../../../../shared/domain/services/DeleteRecordingDomainService';
import { DeleteRecordingRequest } from '../../../../shared/domain/value-objects/DeleteRecordingRequest';
import { IRecordingSessionRepository } from '../../../../shared/domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { RecordingNotFoundError } from '../../../../shared/domain/errors/RecordingErrors';

describe('DeleteRecordingDomainService', () => {
  let service: DeleteRecordingDomainService;
  let recordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let blobStorageService: jest.Mocked<IBlobStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    recordingRepository = { findById: jest.fn(), deleteById: jest.fn() } as any;
    blobStorageService = { deleteRecordingByPath: jest.fn() } as any;
    service = new DeleteRecordingDomainService(recordingRepository, blobStorageService);
  });

  describe('deleteRecording', () => {
    it('should delete recording with blob successfully', async () => {
      const mockSession = { id: 'session-123', blobPath: 'path/to/recording.mp4' };
      recordingRepository.findById.mockResolvedValue(mockSession as any);
      blobStorageService.deleteRecordingByPath.mockResolvedValue(true);
      const request = new DeleteRecordingRequest('session-123');
      const result = await service.deleteRecording(request);
      expect(result.blobDeleted).toBe(true);
      expect(result.dbDeleted).toBe(true);
    });

    it('should throw RecordingNotFoundError when session not found', async () => {
      recordingRepository.findById.mockResolvedValue(null);
      const request = new DeleteRecordingRequest('session-123');
      await expect(service.deleteRecording(request)).rejects.toThrow(RecordingNotFoundError);
    });

    it('should handle blob deletion failure gracefully', async () => {
      const mockSession = { id: 'session-123', blobPath: 'path/to/recording.mp4' };
      recordingRepository.findById.mockResolvedValue(mockSession as any);
      blobStorageService.deleteRecordingByPath.mockRejectedValue(new Error('Blob not found'));
      const request = new DeleteRecordingRequest('session-123');
      const result = await service.deleteRecording(request);
      expect(result.blobMissing).toBe(true);
      expect(result.dbDeleted).toBe(true);
    });
  });
});