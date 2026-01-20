import { GetCameraFailuresDomainService } from '../../../src/domain/services/GetCameraFailuresDomainService';
import { ICameraStartFailureRepository } from '../../../src/domain/interfaces/ICameraStartFailureRepository';
import { CameraFailureRetrieveError, CameraFailureCountError } from '../../../src/domain/errors/CameraFailureErrors';
import { createMockCameraStartFailureRepository } from './domainServiceTestSetup';

describe('GetCameraFailuresDomainService', () => {
  let service: GetCameraFailuresDomainService;
  let mockRepository: jest.Mocked<ICameraStartFailureRepository>;

  beforeEach(() => {
    mockRepository = createMockCameraStartFailureRepository();
    service = new GetCameraFailuresDomainService(mockRepository);
  });

  describe('getCameraFailures', () => {
    it('should return camera failures successfully', async () => {
      const params = {
        limit: 10,
        offset: 0,
      };
      const mockFailures = [
        {
          id: 'failure-1',
          userAdId: 'user-id',
          userEmail: 'user@example.com',
          stage: 'Permission',
          createdAt: new Date(),
        },
      ];

      mockRepository.list.mockResolvedValue(mockFailures as any);

      const result = await service.getCameraFailures(params);

      expect(mockRepository.list).toHaveBeenCalledWith(params);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('failure-1');
    });

    it('should throw CameraFailureRetrieveError when repository fails', async () => {
      mockRepository.list.mockRejectedValue(new Error('Database error'));

      await expect(service.getCameraFailures()).rejects.toThrow(CameraFailureRetrieveError);
    });
  });

  describe('getCameraFailureById', () => {
    it('should return camera failure by id', async () => {
      const mockFailure = {
        id: 'failure-id',
        userAdId: 'user-id',
        userEmail: 'user@example.com',
        stage: 'Permission',
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockFailure as any);

      const result = await service.getCameraFailureById('failure-id');

      expect(mockRepository.findById).toHaveBeenCalledWith('failure-id');
      expect(result).toBe(mockFailure);
    });

    it('should throw CameraFailureRetrieveError when repository fails', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.getCameraFailureById('failure-id')).rejects.toThrow(CameraFailureRetrieveError);
    });
  });

  describe('countCameraFailures', () => {
    it('should return count of camera failures', async () => {
      const params = {
        userEmail: 'user@example.com',
      };

      mockRepository.count.mockResolvedValue(3);

      const result = await service.countCameraFailures(params);

      expect(mockRepository.count).toHaveBeenCalledWith(params);
      expect(result).toBe(3);
    });

    it('should throw CameraFailureCountError when repository fails', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.countCameraFailures()).rejects.toThrow(CameraFailureCountError);
    });
  });
});






