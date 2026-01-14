import { GetCameraFailuresApplicationService } from '../../../src/application/services/GetCameraFailuresApplicationService';
import { GetCameraFailuresDomainService } from '../../../src/domain/services/GetCameraFailuresDomainService';
import { CameraFailureQueryParams, CameraStartFailure } from '../../../src/domain/types/CameraFailureTypes';

describe('GetCameraFailuresApplicationService', () => {
  let service: GetCameraFailuresApplicationService;
  let mockDomainService: jest.Mocked<GetCameraFailuresDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getCameraFailures: jest.fn(),
      countCameraFailures: jest.fn(),
      getCameraFailureById: jest.fn(),
    } as any;

    service = new GetCameraFailuresApplicationService(mockDomainService);
  });

  describe('getCameraFailures', () => {
    it('should successfully get camera failures with params', async () => {
      const params: CameraFailureQueryParams = {
        limit: 10,
        offset: 0,
      };
      const mockFailures: CameraStartFailure[] = [
        {
          id: 'failure-1',
          stage: 'Permission',
          errorName: 'PermissionDenied',
          errorMessage: 'Camera permission denied',
          userAdId: 'user-id',
          userEmail: 'user@example.com',
          createdAt: new Date(),
        } as CameraStartFailure,
      ];

      mockDomainService.getCameraFailures.mockResolvedValue(mockFailures);
      mockDomainService.countCameraFailures.mockResolvedValue(1);

      const result = await service.getCameraFailures(params);

      expect(mockDomainService.getCameraFailures).toHaveBeenCalledWith(params);
      expect(mockDomainService.countCameraFailures).toHaveBeenCalledWith(params);
      expect(result.failures).toEqual(mockFailures);
      expect(result.total).toBe(1);
    });

    it('should successfully get camera failures without params', async () => {
      const mockFailures: CameraStartFailure[] = [];
      mockDomainService.getCameraFailures.mockResolvedValue(mockFailures);
      mockDomainService.countCameraFailures.mockResolvedValue(0);

      const result = await service.getCameraFailures();

      expect(mockDomainService.getCameraFailures).toHaveBeenCalledWith(undefined);
      expect(mockDomainService.countCameraFailures).toHaveBeenCalledWith(undefined);
      expect(result.failures).toEqual(mockFailures);
      expect(result.total).toBe(0);
    });
  });

  describe('getCameraFailureById', () => {
    it('should successfully get camera failure by id', async () => {
      const id = 'failure-1';
      const mockFailure: CameraStartFailure = {
        id,
        stage: 'Permission',
        errorName: 'PermissionDenied',
        errorMessage: 'Camera permission denied',
        userAdId: 'user-id',
        userEmail: 'user@example.com',
        createdAt: new Date(),
      } as CameraStartFailure;

      mockDomainService.getCameraFailureById.mockResolvedValue(mockFailure);

      const result = await service.getCameraFailureById(id);

      expect(mockDomainService.getCameraFailureById).toHaveBeenCalledWith(id);
      expect(result).toBe(mockFailure);
    });

    it('should return null when camera failure not found', async () => {
      const id = 'non-existent';
      mockDomainService.getCameraFailureById.mockResolvedValue(null);

      const result = await service.getCameraFailureById(id);

      expect(mockDomainService.getCameraFailureById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });
});

