import { DeleteRecordingDomainService } from '../../../src/domain/services/DeleteRecordingDomainService';
import { IRecordingSessionRepository } from '../../../src/domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { DeleteRecordingRequest } from '../../../src/domain/value-objects/DeleteRecordingRequest';
import { DeleteRecordingResponse } from '../../../src/domain/value-objects/DeleteRecordingResponse';
import { RecordingNotFoundError } from '../../../src/domain/errors/RecordingErrors';
import { createMockRecordingSessionRepository, createMockBlobStorageService } from './domainServiceTestSetup';

describe('DeleteRecordingDomainService', () => {
  let service: DeleteRecordingDomainService;
  let mockRecordingRepository: jest.Mocked<IRecordingSessionRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;

  beforeEach(() => {
    mockRecordingRepository = createMockRecordingSessionRepository();
    mockBlobStorageService = createMockBlobStorageService();
    service = new DeleteRecordingDomainService(mockRecordingRepository, mockBlobStorageService);
  });

  describe('deleteRecording', () => {
    it('should delete recording successfully with blob path', async () => {
      const request = new DeleteRecordingRequest('recording-id');
      const session = {
        id: 'recording-id',
        blobPath: 'recordings/session-id/video.mp4',
      };

      mockRecordingRepository.findById.mockResolvedValue(session as any);
      mockBlobStorageService.deleteRecordingByPath.mockResolvedValue(true);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(request);

      expect(mockBlobStorageService.deleteRecordingByPath).toHaveBeenCalledWith('recordings/session-id/video.mp4');
      expect(mockRecordingRepository.deleteById).toHaveBeenCalledWith('recording-id');
      expect(result.message).toContain('deleted successfully');
      expect(result.blobDeleted).toBe(true);
      expect(result.dbDeleted).toBe(true);
    });

    it('should delete recording when blob path is extracted from URL', async () => {
      const request = new DeleteRecordingRequest('recording-id');
      const session = {
        id: 'recording-id',
        blobUrl: 'https://storage.blob.core.windows.net/recordings/session-id/video.mp4',
      };

      mockRecordingRepository.findById.mockResolvedValue(session as any);
      mockBlobStorageService.deleteRecordingByPath.mockResolvedValue(true);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(request);

      expect(mockBlobStorageService.deleteRecordingByPath).toHaveBeenCalledWith('session-id/video.mp4');
      expect(result.blobDeleted).toBe(true);
    });

    it('should throw error when recording not found', async () => {
      const request = new DeleteRecordingRequest('recording-id');

      mockRecordingRepository.findById.mockResolvedValue(null);

      await expect(service.deleteRecording(request)).rejects.toThrow(RecordingNotFoundError);
    });

    it('should continue deletion when blob deletion fails', async () => {
      const request = new DeleteRecordingRequest('recording-id');
      const session = {
        id: 'recording-id',
        blobPath: 'recordings/session-id/video.mp4',
      };

      mockRecordingRepository.findById.mockResolvedValue(session as any);
      mockBlobStorageService.deleteRecordingByPath.mockRejectedValue(new Error('Blob not found'));
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(request);

      expect(mockRecordingRepository.deleteById).toHaveBeenCalled();
      expect(result.blobMissing).toBe(true);
      expect(result.dbDeleted).toBe(true);
    });

    it('should handle recording without blob path or URL', async () => {
      const request = new DeleteRecordingRequest('recording-id');
      const session = {
        id: 'recording-id',
      };

      mockRecordingRepository.findById.mockResolvedValue(session as any);
      mockRecordingRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteRecording(request);

      expect(mockBlobStorageService.deleteRecordingByPath).not.toHaveBeenCalled();
      expect(result.blobPath).toBeNull();
      expect(result.blobMissing).toBe(true);
      expect(result.dbDeleted).toBe(true);
    });
  });
});

